import type { RowDataPacket } from 'mysql2/promise';
import type {
  ActivityCategoryConfig,
  BusinessConfigBootstrap,
  ConfigAuditEvent,
  ConfigDomain,
  ConfigEntityType,
  ConfigVersionMap,
  FeedbackOptionConfig,
  OnboardingOptionConfig,
  OnboardingQuestionConfig,
  ProfileOptionConfig,
  RecommendationConfig,
  RecommendationRuleConfig,
  RecommendationSettingConfig,
} from '../src/config/types';
import { toIsoTimestamp } from './db';
import type { QiahaoDatabase } from './db';

const configDomains: ConfigDomain[] = [
  'activity-categories',
  'onboarding',
  'profile-options',
  'feedback-options',
  'recommendation',
];

function jsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function enabledClause(includeDisabled: boolean, alias = ''): string {
  return includeDisabled ? '' : ` WHERE ${alias ? `${alias}.` : ''}enabled=1`;
}

export async function getConfigVersions(database: QiahaoDatabase): Promise<ConfigVersionMap> {
  const rows = await database.query<Array<RowDataPacket & { domain_key: ConfigDomain; revision_no: number | string }>>(
    `SELECT domain_key,MAX(revision_no) AS revision_no
       FROM config_revisions
      GROUP BY domain_key`,
  );
  const versions = Object.fromEntries(configDomains.map((domain) => [domain, 0])) as unknown as ConfigVersionMap;
  for (const row of rows) {
    if (configDomains.includes(row.domain_key)) versions[row.domain_key] = Number(row.revision_no);
  }
  return versions;
}

export async function listActivityCategoryConfigs(database: QiahaoDatabase, includeDisabled = false): Promise<ActivityCategoryConfig[]> {
  const rows = await database.query<Array<RowDataPacket & {
    config_key: string; label: string; theme_key: string; icon_key: string; description: string;
    enabled: number | boolean; sort_order: number | string; updated_at: string;
  }>>(
    `SELECT config_key,label,theme_key,icon_key,description,enabled,sort_order,updated_at
       FROM activity_category_configs${enabledClause(includeDisabled)}
      ORDER BY sort_order,id`,
  );
  return rows.map((row) => ({
    key: row.config_key,
    label: row.label,
    themeKey: row.theme_key,
    iconKey: row.icon_key,
    description: row.description,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    updatedAt: toIsoTimestamp(row.updated_at),
  }));
}

export async function listOnboardingConfigs(database: QiahaoDatabase, includeDisabled = false): Promise<OnboardingQuestionConfig[]> {
  const rows = await database.query<Array<RowDataPacket & {
    question_key: string; section_key: string; prompt: string; input_type: OnboardingQuestionConfig['inputType'];
    required_flag: number | boolean; max_selections: number | string | null; enabled: number | boolean;
    sort_order: number | string; updated_at: string; option_key: string | null; option_label: string | null;
    answer_value: string | null; option_enabled: number | boolean | null; option_sort_order: number | string | null;
  }>>(
    `SELECT q.question_key,q.section_key,q.prompt,q.input_type,q.required_flag,q.max_selections,
            q.enabled,q.sort_order,q.updated_at,o.option_key,o.label AS option_label,o.answer_value,
            o.enabled AS option_enabled,o.sort_order AS option_sort_order
       FROM onboarding_question_configs q
       LEFT JOIN onboarding_option_configs o ON o.question_id=q.id${includeDisabled ? '' : ' AND o.enabled=1'}
      ${includeDisabled ? '' : 'WHERE q.enabled=1'}
      ORDER BY q.sort_order,q.id,o.sort_order,o.id`,
  );
  const questions = new Map<string, OnboardingQuestionConfig>();
  for (const row of rows) {
    let question = questions.get(row.question_key);
    if (!question) {
      question = {
        key: row.question_key,
        sectionKey: row.section_key,
        prompt: row.prompt,
        inputType: row.input_type,
        required: Boolean(row.required_flag),
        maxSelections: row.max_selections === null ? null : Number(row.max_selections),
        enabled: Boolean(row.enabled),
        sortOrder: Number(row.sort_order),
        updatedAt: toIsoTimestamp(row.updated_at),
        options: [],
      };
      questions.set(row.question_key, question);
    }
    if (row.option_key && row.option_label !== null && row.answer_value !== null) {
      question.options.push({
        key: row.option_key,
        label: row.option_label,
        value: row.answer_value,
        enabled: Boolean(row.option_enabled),
        sortOrder: Number(row.option_sort_order ?? 0),
      });
    }
  }
  return [...questions.values()];
}

export async function listProfileOptionConfigs(database: QiahaoDatabase, includeDisabled = false): Promise<ProfileOptionConfig[]> {
  const rows = await database.query<Array<RowDataPacket & {
    group_key: string; option_key: string; label: string; option_value: string; enabled: number | boolean;
    sort_order: number | string; updated_at: string;
  }>>(
    `SELECT group_key,option_key,label,option_value,enabled,sort_order,updated_at
       FROM profile_option_configs${enabledClause(includeDisabled)}
      ORDER BY group_key,sort_order,id`,
  );
  return rows.map((row) => ({
    groupKey: row.group_key,
    key: row.option_key,
    label: row.label,
    value: row.option_value,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    updatedAt: toIsoTimestamp(row.updated_at),
  }));
}

export async function listFeedbackOptionConfigs(database: QiahaoDatabase, includeDisabled = false): Promise<FeedbackOptionConfig[]> {
  const rows = await database.query<Array<RowDataPacket & {
    group_key: string; option_key: string; label: string; description: string; enabled: number | boolean;
    sort_order: number | string; updated_at: string;
  }>>(
    `SELECT group_key,option_key,label,description,enabled,sort_order,updated_at
       FROM feedback_option_configs${enabledClause(includeDisabled)}
      ORDER BY group_key,sort_order,id`,
  );
  return rows.map((row) => ({
    groupKey: row.group_key,
    key: row.option_key,
    label: row.label,
    description: row.description,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    updatedAt: toIsoTimestamp(row.updated_at),
  }));
}

export async function listRecommendationConfig(database: QiahaoDatabase, includeDisabled = false): Promise<RecommendationConfig> {
  const [ruleRows, settingRows] = await Promise.all([
    database.query<Array<RowDataPacket & {
      rule_key: string; source_term: string; themes_json: unknown; tokens_json: unknown; reason_text: string;
      enabled: number | boolean; sort_order: number | string; updated_at: string;
    }>>(
      `SELECT rule_key,source_term,themes_json,tokens_json,reason_text,enabled,sort_order,updated_at
         FROM recommendation_rule_configs${enabledClause(includeDisabled)}
        ORDER BY sort_order,id`,
    ),
    database.query<Array<RowDataPacket & {
      setting_key: string; value_json: unknown; description: string; enabled: number | boolean;
      sort_order: number | string; updated_at: string;
    }>>(
      `SELECT setting_key,value_json,description,enabled,sort_order,updated_at
         FROM recommendation_setting_configs${enabledClause(includeDisabled)}
        ORDER BY sort_order,id`,
    ),
  ]);
  const rules: RecommendationRuleConfig[] = ruleRows.map((row) => ({
    key: row.rule_key,
    sourceTerm: row.source_term,
    themes: jsonValue<string[]>(row.themes_json, []),
    tokens: jsonValue<string[]>(row.tokens_json, []),
    reasonText: row.reason_text,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    updatedAt: toIsoTimestamp(row.updated_at),
  }));
  const settings: RecommendationSettingConfig[] = settingRows.map((row) => ({
    key: row.setting_key,
    value: jsonValue(row.value_json, null),
    description: row.description,
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    updatedAt: toIsoTimestamp(row.updated_at),
  }));
  return { rules, settings };
}

export async function getBusinessConfigBootstrap(database: QiahaoDatabase, includeDisabled = false): Promise<BusinessConfigBootstrap> {
  const [versions, activityCategories, onboarding, profileOptions, feedbackOptions, recommendation] = await Promise.all([
    getConfigVersions(database),
    listActivityCategoryConfigs(database, includeDisabled),
    listOnboardingConfigs(database, includeDisabled),
    listProfileOptionConfigs(database, includeDisabled),
    listFeedbackOptionConfigs(database, includeDisabled),
    listRecommendationConfig(database, includeDisabled),
  ]);
  return { versions, activityCategories, onboarding, profileOptions, feedbackOptions, recommendation };
}

export async function listConfigAuditEvents(database: QiahaoDatabase, domain: ConfigDomain, limit = 100): Promise<ConfigAuditEvent[]> {
  const rows = await database.query<Array<RowDataPacket & {
    id: number | string; revision_no: number | string; domain_key: ConfigDomain; entity_type: ConfigEntityType;
    entity_key: string; action: ConfigAuditEvent['action']; actor_id: string | null; before_data: unknown;
    after_data: unknown; created_at: string;
  }>>(
    `SELECT e.id,r.revision_no,e.domain_key,e.entity_type,e.entity_key,e.action,e.actor_id,
            e.before_data,e.after_data,e.created_at
       FROM config_audit_events e
       JOIN config_revisions r ON r.id=e.revision_id
      WHERE e.domain_key=?
      ORDER BY e.created_at DESC,e.id DESC
      LIMIT ?`,
    [domain, Math.max(1, Math.min(500, limit))],
  );
  return rows.map((row) => ({
    id: String(row.id),
    revision: Number(row.revision_no),
    domain: row.domain_key,
    entityType: row.entity_type,
    entityKey: row.entity_key,
    action: row.action,
    actorId: row.actor_id,
    before: jsonValue(row.before_data, null),
    after: jsonValue(row.after_data, null),
    createdAt: toIsoTimestamp(row.created_at),
  }));
}

export async function isEnabledConfigValue(
  database: QiahaoDatabase,
  table: 'activity_category_configs' | 'feedback_option_configs' | 'profile_option_configs',
  keyColumn: 'config_key' | 'option_key',
  key: string,
  groupKey?: string,
): Promise<boolean> {
  const group = groupKey ? ' AND group_key=?' : '';
  const rows = await database.query<RowDataPacket[]>(
    `SELECT 1 FROM ${table} WHERE ${keyColumn}=?${group} AND enabled=1 LIMIT 1`,
    groupKey ? [key, groupKey] : [key],
  );
  return rows.length > 0;
}
