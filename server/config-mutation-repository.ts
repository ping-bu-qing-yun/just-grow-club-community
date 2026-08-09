import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { ConfigDomain, ConfigEntityType } from '../src/config/types';
import type { QiahaoConnection, QiahaoDatabase } from './db';

export class ConfigMutationError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409,
    public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'VERSION_CONFLICT',
    message: string,
  ) {
    super(message);
    this.name = 'ConfigMutationError';
  }
}

type Executor = Pick<QiahaoConnection, 'query'>;
type Values = Record<string, unknown>;
type MutationMode = 'create' | 'update' | 'disable' | 'restore';

const entityDomains: Record<ConfigEntityType, ConfigDomain> = {
  'activity-category': 'activity-categories',
  'onboarding-question': 'onboarding',
  'onboarding-option': 'onboarding',
  'profile-option': 'profile-options',
  'feedback-option': 'feedback-options',
  'recommendation-rule': 'recommendation',
  'recommendation-setting': 'recommendation',
};

function textValue(values: Values, key: string, max: number, required = true): string {
  const raw = values[key];
  if (raw === undefined && !required) return '';
  if (typeof raw !== 'string') throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${key} 格式无效`);
  const value = raw.trim();
  if ((required && !value) || value.length > max) throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${key} 格式无效`);
  return value;
}

function optionalText(values: Values, key: string, max: number): string | undefined {
  if (values[key] === undefined) return undefined;
  return textValue(values, key, max, false);
}

function sortOrder(values: Values, fallback = 0): number {
  if (values.sortOrder === undefined) return fallback;
  const value = Number(values.sortOrder);
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'sortOrder 必须是 0 到 65535 的整数');
  }
  return value;
}

function booleanValue(values: Values, key: string, fallback: boolean): boolean {
  if (values[key] === undefined) return fallback;
  if (typeof values[key] !== 'boolean') throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${key} 必须是布尔值`);
  return values[key];
}

function stableKey(value: string, label = 'key'): string {
  const key = value.trim();
  if (!/^[a-z0-9][a-z0-9:_-]{0,159}$/i.test(key)) {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${label} 只能包含字母、数字、冒号、下划线和连字符`);
  }
  return key;
}

function stringArray(values: Values, key: string): string[] {
  const value = values[key];
  if (!Array.isArray(value) || value.length > 100 || value.some((item) => typeof item !== 'string' || !item.trim() || item.length > 120)) {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${key} 必须是有效的字符串数组`);
  }
  return value.map((item) => String(item).trim());
}

function jsonValue(values: Values, key: string): unknown {
  if (!(key in values)) throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${key} 不能为空`);
  const value = values[key];
  try {
    JSON.stringify(value);
  } catch {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${key} 不是有效 JSON`);
  }
  return value;
}

function boundedNumber(value: unknown, label: string, minimum = 0, maximum = 100): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${label} 必须是 ${minimum} 到 ${maximum} 之间的数字`);
  }
  return value;
}

function plainObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${label} 必须是对象`);
  }
  return value as Record<string, unknown>;
}

function validateRecommendationSettingValue(key: string, value: unknown): void {
  const settingKey = stableKey(key, '推荐设置 key');
  if (settingKey === 'weights') {
    const weights = plainObject(value, 'weights');
    const allowed = new Set(['intent', 'scene', 'profile', 'theme', 'formal', 'pre', 'city', 'joinedPenalty']);
    if (!Object.keys(weights).length || Object.keys(weights).some((name) => !allowed.has(name))) {
      throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'weights 包含未知或空的权重项');
    }
    for (const [name, candidate] of Object.entries(weights)) boundedNumber(candidate, `weights.${name}`);
    return;
  }
  if (settingKey === 'cold_start') {
    const coldStart = plainObject(value, 'cold_start');
    const allowed = new Set(['formal', 'pre']);
    if (!Object.keys(coldStart).length || Object.keys(coldStart).some((name) => !allowed.has(name))) {
      throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'cold_start 只能配置 formal 和 pre');
    }
    for (const [name, candidate] of Object.entries(coldStart)) boundedNumber(candidate, `cold_start.${name}`);
    return;
  }
  if (settingKey === 'thresholds') {
    if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
      throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'thresholds 必须包含 1 到 20 个等级');
    }
    for (const [index, item] of value.entries()) {
      const threshold = plainObject(item, `thresholds[${index}]`);
      if (Object.keys(threshold).some((name) => !['min', 'label'].includes(name))) {
        throw new ConfigMutationError(400, 'VALIDATION_ERROR', `thresholds[${index}] 包含未知字段`);
      }
      boundedNumber(threshold.min, `thresholds[${index}].min`);
      if (typeof threshold.label !== 'string' || !threshold.label.trim() || threshold.label.trim().length > 120) {
        throw new ConfigMutationError(400, 'VALIDATION_ERROR', `thresholds[${index}].label 格式无效`);
      }
    }
    return;
  }
  if (settingKey === 'summary_rules') {
    if (!Array.isArray(value) || value.length > 50) {
      throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'summary_rules 最多包含 50 条规则');
    }
    for (const [index, item] of value.entries()) {
      const rule = plainObject(item, `summary_rules[${index}]`);
      if (Object.keys(rule).some((name) => !['terms', 'label'].includes(name))) {
        throw new ConfigMutationError(400, 'VALIDATION_ERROR', `summary_rules[${index}] 包含未知字段`);
      }
      if (!Array.isArray(rule.terms) || rule.terms.length < 1 || rule.terms.length > 20
        || rule.terms.some((term) => typeof term !== 'string' || !term.trim() || term.trim().length > 120)) {
        throw new ConfigMutationError(400, 'VALIDATION_ERROR', `summary_rules[${index}].terms 格式无效`);
      }
      if (typeof rule.label !== 'string' || !rule.label.trim() || rule.label.trim().length > 255) {
        throw new ConfigMutationError(400, 'VALIDATION_ERROR', `summary_rules[${index}].label 格式无效`);
      }
    }
    return;
  }
  throw new ConfigMutationError(400, 'VALIDATION_ERROR', '不支持的推荐设置 key');
}

function compositeKey(key: string, label: string): [string, string] {
  const separator = key.indexOf('::');
  if (separator <= 0 || separator === key.length - 2) {
    throw new ConfigMutationError(400, 'VALIDATION_ERROR', `${label} 必须使用 group::key 格式`);
  }
  return [stableKey(key.slice(0, separator), `${label} 分组`), stableKey(key.slice(separator + 2), label)];
}

async function currentRevision(connection: Executor, domain: ConfigDomain): Promise<number> {
  const rows = await connection.query<Array<RowDataPacket & { revision: number | string }>>(
    'SELECT COALESCE(MAX(revision_no),0) AS revision FROM config_revisions WHERE domain_key=?',
    [domain],
  );
  return Number(rows[0]?.revision ?? 0);
}

async function createRevision(
  connection: QiahaoConnection,
  domain: ConfigDomain,
  actorId: string,
  expectedRevision: number,
  summary: string,
): Promise<{ id: number; revision: number }> {
  const current = await currentRevision(connection, domain);
  if (current !== expectedRevision) {
    throw new ConfigMutationError(409, 'VERSION_CONFLICT', `配置版本已从 ${expectedRevision} 更新为 ${current}，请刷新后重试`);
  }
  const revision = current + 1;
  const result = await connection.query<ResultSetHeader>(
    'INSERT INTO config_revisions (domain_key,revision_no,actor_id,summary) VALUES (?,?,?,?)',
    [domain, revision, actorId, summary],
  );
  return { id: Number(result.insertId), revision };
}

async function readEntity(connection: Executor, entityType: ConfigEntityType, key: string): Promise<Record<string, unknown> | null> {
  let rows: RowDataPacket[];
  if (entityType === 'activity-category') {
    rows = await connection.query<RowDataPacket[]>('SELECT * FROM activity_category_configs WHERE config_key=? LIMIT 1', [stableKey(key)]);
  } else if (entityType === 'onboarding-question') {
    rows = await connection.query<RowDataPacket[]>('SELECT * FROM onboarding_question_configs WHERE question_key=? LIMIT 1', [stableKey(key)]);
  } else if (entityType === 'onboarding-option') {
    const [questionKey, optionKey] = compositeKey(key, '问卷选项 key');
    rows = await connection.query<RowDataPacket[]>(
      `SELECT o.* FROM onboarding_option_configs o
        JOIN onboarding_question_configs q ON q.id=o.question_id
       WHERE q.question_key=? AND o.option_key=? LIMIT 1`,
      [questionKey, optionKey],
    );
  } else if (entityType === 'profile-option') {
    const [groupKey, optionKey] = compositeKey(key, '资料选项 key');
    rows = await connection.query<RowDataPacket[]>('SELECT * FROM profile_option_configs WHERE group_key=? AND option_key=? LIMIT 1', [groupKey, optionKey]);
  } else if (entityType === 'feedback-option') {
    const [groupKey, optionKey] = compositeKey(key, '反馈选项 key');
    rows = await connection.query<RowDataPacket[]>('SELECT * FROM feedback_option_configs WHERE group_key=? AND option_key=? LIMIT 1', [groupKey, optionKey]);
  } else if (entityType === 'recommendation-rule') {
    rows = await connection.query<RowDataPacket[]>('SELECT * FROM recommendation_rule_configs WHERE rule_key=? LIMIT 1', [stableKey(key)]);
  } else {
    rows = await connection.query<RowDataPacket[]>('SELECT * FROM recommendation_setting_configs WHERE setting_key=? LIMIT 1', [stableKey(key)]);
  }
  return rows[0] ? { ...rows[0] } : null;
}

async function insertEntity(connection: QiahaoConnection, entityType: ConfigEntityType, key: string, values: Values, actorId: string): Promise<void> {
  if (entityType === 'activity-category') {
    await connection.query(
      `INSERT INTO activity_category_configs
        (config_key,label,theme_key,icon_key,description,enabled,sort_order,created_by,updated_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [stableKey(key), textValue(values, 'label', 120), textValue(values, 'themeKey', 32), textValue(values, 'iconKey', 64), optionalText(values, 'description', 500) ?? '', booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
    );
    return;
  }
  if (entityType === 'onboarding-question') {
    const inputType = textValue(values, 'inputType', 16);
    if (!['single', 'multiple', 'text'].includes(inputType)) throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'inputType 无效');
    const maxSelections = values.maxSelections === null || values.maxSelections === undefined ? null : Number(values.maxSelections);
    if (maxSelections !== null && (!Number.isInteger(maxSelections) || maxSelections < 1 || maxSelections > 100)) {
      throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'maxSelections 无效');
    }
    await connection.query(
      `INSERT INTO onboarding_question_configs
        (question_key,section_key,prompt,input_type,required_flag,max_selections,enabled,sort_order,created_by,updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [stableKey(key), textValue(values, 'sectionKey', 64), textValue(values, 'prompt', 1000), inputType, booleanValue(values, 'required', true), maxSelections, booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
    );
    return;
  }
  if (entityType === 'onboarding-option') {
    const [questionKey, optionKey] = compositeKey(key, '问卷选项 key');
    const questions = await connection.query<Array<RowDataPacket & { id: number | string }>>('SELECT id FROM onboarding_question_configs WHERE question_key=? LIMIT 1', [questionKey]);
    if (!questions[0]) throw new ConfigMutationError(404, 'NOT_FOUND', '问卷题目不存在');
    await connection.query(
      `INSERT INTO onboarding_option_configs
        (question_id,option_key,label,answer_value,enabled,sort_order,created_by,updated_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [questions[0].id, optionKey, textValue(values, 'label', 255), textValue(values, 'value', 500), booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
    );
    return;
  }
  if (entityType === 'profile-option' || entityType === 'feedback-option') {
    const [groupKey, optionKey] = compositeKey(key, entityType === 'profile-option' ? '资料选项 key' : '反馈选项 key');
    if (entityType === 'profile-option') {
      await connection.query(
        `INSERT INTO profile_option_configs
          (group_key,option_key,label,option_value,enabled,sort_order,created_by,updated_by)
         VALUES (?,?,?,?,?,?,?,?)`,
        [groupKey, optionKey, textValue(values, 'label', 255), textValue(values, 'value', 500), booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
      );
    } else {
      await connection.query(
        `INSERT INTO feedback_option_configs
          (group_key,option_key,label,description,enabled,sort_order,created_by,updated_by)
         VALUES (?,?,?,?,?,?,?,?)`,
        [groupKey, optionKey, textValue(values, 'label', 255), optionalText(values, 'description', 500) ?? '', booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
      );
    }
    return;
  }
  if (entityType === 'recommendation-rule') {
    await connection.query(
      `INSERT INTO recommendation_rule_configs
        (rule_key,source_term,themes_json,tokens_json,reason_text,enabled,sort_order,created_by,updated_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [stableKey(key), textValue(values, 'sourceTerm', 255), JSON.stringify(stringArray(values, 'themes')), JSON.stringify(stringArray(values, 'tokens')), optionalText(values, 'reasonText', 255) ?? '', booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
    );
    return;
  }
  await connection.query(
    `INSERT INTO recommendation_setting_configs
      (setting_key,value_json,description,enabled,sort_order,created_by,updated_by)
     VALUES (?,?,?,?,?,?,?)`,
    [stableKey(key), JSON.stringify(jsonValue(values, 'value')), optionalText(values, 'description', 500) ?? '', booleanValue(values, 'enabled', true), sortOrder(values), actorId, actorId],
  );
}

async function updateEntity(connection: QiahaoConnection, entityType: ConfigEntityType, key: string, values: Values, actorId: string): Promise<void> {
  const before = await readEntity(connection, entityType, key);
  if (!before) throw new ConfigMutationError(404, 'NOT_FOUND', '配置项不存在');
  if (entityType === 'activity-category') {
    await connection.query(
      `UPDATE activity_category_configs
          SET label=?,theme_key=?,icon_key=?,description=?,sort_order=?,updated_by=?
        WHERE config_key=?`,
      [optionalText(values, 'label', 120) ?? before.label, optionalText(values, 'themeKey', 32) ?? before.theme_key, optionalText(values, 'iconKey', 64) ?? before.icon_key, optionalText(values, 'description', 500) ?? before.description, sortOrder(values, Number(before.sort_order)), actorId, stableKey(key)],
    );
    return;
  }
  if (entityType === 'onboarding-question') {
    const inputType = optionalText(values, 'inputType', 16) ?? String(before.input_type);
    if (!['single', 'multiple', 'text'].includes(inputType)) throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'inputType 无效');
    const maxSelections = values.maxSelections === undefined ? before.max_selections : values.maxSelections === null ? null : Number(values.maxSelections);
    if (maxSelections !== null && (!Number.isInteger(maxSelections) || Number(maxSelections) < 1 || Number(maxSelections) > 100)) throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'maxSelections 无效');
    await connection.query(
      `UPDATE onboarding_question_configs
          SET section_key=?,prompt=?,input_type=?,required_flag=?,max_selections=?,sort_order=?,updated_by=?
        WHERE question_key=?`,
      [optionalText(values, 'sectionKey', 64) ?? before.section_key, optionalText(values, 'prompt', 1000) ?? before.prompt, inputType, booleanValue(values, 'required', Boolean(before.required_flag)), maxSelections, sortOrder(values, Number(before.sort_order)), actorId, stableKey(key)],
    );
    return;
  }
  if (entityType === 'onboarding-option') {
    const [questionKey, optionKey] = compositeKey(key, '问卷选项 key');
    await connection.query(
      `UPDATE onboarding_option_configs o
        JOIN onboarding_question_configs q ON q.id=o.question_id
          SET o.label=?,o.answer_value=?,o.sort_order=?,o.updated_by=?
        WHERE q.question_key=? AND o.option_key=?`,
      [optionalText(values, 'label', 255) ?? before.label, optionalText(values, 'value', 500) ?? before.answer_value, sortOrder(values, Number(before.sort_order)), actorId, questionKey, optionKey],
    );
    return;
  }
  if (entityType === 'profile-option' || entityType === 'feedback-option') {
    const [groupKey, optionKey] = compositeKey(key, '配置选项 key');
    if (entityType === 'profile-option') {
      await connection.query(
        `UPDATE profile_option_configs SET label=?,option_value=?,sort_order=?,updated_by=? WHERE group_key=? AND option_key=?`,
        [optionalText(values, 'label', 255) ?? before.label, optionalText(values, 'value', 500) ?? before.option_value, sortOrder(values, Number(before.sort_order)), actorId, groupKey, optionKey],
      );
    } else {
      await connection.query(
        `UPDATE feedback_option_configs SET label=?,description=?,sort_order=?,updated_by=? WHERE group_key=? AND option_key=?`,
        [optionalText(values, 'label', 255) ?? before.label, optionalText(values, 'description', 500) ?? before.description, sortOrder(values, Number(before.sort_order)), actorId, groupKey, optionKey],
      );
    }
    return;
  }
  if (entityType === 'recommendation-rule') {
    await connection.query(
      `UPDATE recommendation_rule_configs
          SET source_term=?,themes_json=?,tokens_json=?,reason_text=?,sort_order=?,updated_by=?
        WHERE rule_key=?`,
      [optionalText(values, 'sourceTerm', 255) ?? before.source_term, values.themes === undefined ? before.themes_json : JSON.stringify(stringArray(values, 'themes')), values.tokens === undefined ? before.tokens_json : JSON.stringify(stringArray(values, 'tokens')), optionalText(values, 'reasonText', 255) ?? before.reason_text, sortOrder(values, Number(before.sort_order)), actorId, stableKey(key)],
    );
    return;
  }
  await connection.query(
    `UPDATE recommendation_setting_configs SET value_json=?,description=?,sort_order=?,updated_by=? WHERE setting_key=?`,
    [values.value === undefined ? before.value_json : JSON.stringify(jsonValue(values, 'value')), optionalText(values, 'description', 500) ?? before.description, sortOrder(values, Number(before.sort_order)), actorId, stableKey(key)],
  );
}

async function setEnabled(connection: QiahaoConnection, entityType: ConfigEntityType, key: string, enabled: boolean, actorId: string): Promise<void> {
  const before = await readEntity(connection, entityType, key);
  if (!before) throw new ConfigMutationError(404, 'NOT_FOUND', '配置项不存在');
  if (entityType === 'activity-category') {
    await connection.query('UPDATE activity_category_configs SET enabled=?,updated_by=? WHERE config_key=?', [enabled, actorId, stableKey(key)]);
  } else if (entityType === 'onboarding-question') {
    await connection.query('UPDATE onboarding_question_configs SET enabled=?,updated_by=? WHERE question_key=?', [enabled, actorId, stableKey(key)]);
  } else if (entityType === 'onboarding-option') {
    const [questionKey, optionKey] = compositeKey(key, '问卷选项 key');
    await connection.query(
      `UPDATE onboarding_option_configs o JOIN onboarding_question_configs q ON q.id=o.question_id
          SET o.enabled=?,o.updated_by=? WHERE q.question_key=? AND o.option_key=?`,
      [enabled, actorId, questionKey, optionKey],
    );
  } else if (entityType === 'profile-option' || entityType === 'feedback-option') {
    const [groupKey, optionKey] = compositeKey(key, '配置选项 key');
    const table = entityType === 'profile-option' ? 'profile_option_configs' : 'feedback_option_configs';
    await connection.query(`UPDATE ${table} SET enabled=?,updated_by=? WHERE group_key=? AND option_key=?`, [enabled, actorId, groupKey, optionKey]);
  } else if (entityType === 'recommendation-rule') {
    await connection.query('UPDATE recommendation_rule_configs SET enabled=?,updated_by=? WHERE rule_key=?', [enabled, actorId, stableKey(key)]);
  } else {
    await connection.query('UPDATE recommendation_setting_configs SET enabled=?,updated_by=? WHERE setting_key=?', [enabled, actorId, stableKey(key)]);
  }
}

export async function mutateConfigEntity(
  database: QiahaoDatabase,
  input: {
    domain: ConfigDomain;
    entityType: ConfigEntityType;
    key: string;
    values?: Values;
    expectedRevision: number;
    actorId: string;
    mode: MutationMode;
  },
): Promise<{ revision: number; entity: Record<string, unknown> }> {
  if (entityDomains[input.entityType] !== input.domain) throw new ConfigMutationError(400, 'VALIDATION_ERROR', '配置域与实体类型不匹配');
  if (!Number.isInteger(input.expectedRevision) || input.expectedRevision < 0) throw new ConfigMutationError(400, 'VALIDATION_ERROR', 'expectedRevision 无效');
  const values = input.values ?? {};
  if (input.entityType === 'recommendation-setting' && (input.mode === 'create' || values.value !== undefined)) {
    validateRecommendationSettingValue(input.key, jsonValue(values, 'value'));
  }
  try {
    return await database.transaction(async (connection) => {
      const before = await readEntity(connection, input.entityType, input.key);
      if (input.mode === 'create' && before) throw new ConfigMutationError(409, 'CONFLICT', '配置项已存在');
      if (input.mode !== 'create' && !before) throw new ConfigMutationError(404, 'NOT_FOUND', '配置项不存在');
      const action = input.mode === 'create' ? 'created' : input.mode === 'disable' ? 'disabled' : input.mode === 'restore' ? 'restored' : 'updated';
      const revision = await createRevision(connection, input.domain, input.actorId, input.expectedRevision, `${action}:${input.entityType}:${input.key}`);
      if (input.mode === 'create') await insertEntity(connection, input.entityType, input.key, values, input.actorId);
      else if (input.mode === 'update') await updateEntity(connection, input.entityType, input.key, values, input.actorId);
      else await setEnabled(connection, input.entityType, input.key, input.mode === 'restore', input.actorId);
      const after = await readEntity(connection, input.entityType, input.key);
      if (!after) throw new ConfigMutationError(404, 'NOT_FOUND', '配置项不存在');
      await connection.query(
        `INSERT INTO config_audit_events
          (revision_id,domain_key,entity_type,entity_key,action,actor_id,before_data,after_data)
         VALUES (?,?,?,?,?,?,?,?)`,
        [revision.id, input.domain, input.entityType, input.key, action, input.actorId, before ? JSON.stringify(before) : null, JSON.stringify(after)],
      );
      return { revision: revision.revision, entity: after };
    });
  } catch (error) {
    if (error instanceof ConfigMutationError) throw error;
    const mysqlError = error as { errno?: number; code?: string };
    if (mysqlError.errno === 1062 || mysqlError.code === 'ER_DUP_ENTRY') {
      throw new ConfigMutationError(409, 'CONFLICT', '配置已被其他请求修改，请刷新后重试');
    }
    throw error;
  }
}
