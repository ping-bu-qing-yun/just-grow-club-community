import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { BasicProfile, ClubState } from '../src/club/types';
import { toMysqlDateTime } from './db';
import type { QiahaoConnection, QiahaoDatabase } from './db';

export class ProfileRepositoryError extends Error {
  constructor(public readonly status: 400 | 404, public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND', message: string) {
    super(message);
    this.name = 'ProfileRepositoryError';
  }
}

type ProfileRow = RowDataPacket & {
  name: string;
  bio: string;
  birth_date: string | null;
  gender: BasicProfile['gender'] | null;
  education: string | null;
  occupation: string | null;
  height_cm: number | string | null;
  city: string | null;
  district: string | null;
  hometown: string | null;
  relationship_status: string | null;
};

type ProgressRow = RowDataPacket & { current_step: number | string; completed_at: string | null };
type AnswerRow = RowDataPacket & { question_key: string; answer_order: number | string; answer_value: string };
type TagRow = RowDataPacket & { tag_kind: 'profile_tag' | 'preference'; label: string };

function parseHeight(value: string): number | null {
  const height = Number.parseInt(value, 10);
  return Number.isInteger(height) && height >= 80 && height <= 250 ? height : null;
}

function splitCity(value: string): { city: string; district: string } {
  const [city = '', ...district] = value.trim().split(/\s+/);
  return { city, district: district.join(' ') };
}

function fallbackProfile(name: string, bio: string): BasicProfile {
  return {
    nickname: name,
    birthDate: '',
    gender: '不透露',
    education: '',
    occupation: '',
    height: '',
    city: '',
    hometown: '',
    relationship: '',
    bio,
    tags: [],
    preferences: [],
  };
}

export async function getProfileRecord(database: QiahaoDatabase, userId: string): Promise<ClubState> {
  const [profiles, progressRows, answerRows, tagRows] = await Promise.all([
    database.query<ProfileRow[]>(
      `SELECT u.name,u.bio,p.birth_date,p.gender,p.education,p.occupation,p.height_cm,
              p.city,p.district,p.hometown,p.relationship_status
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id=u.id
        WHERE u.id=? LIMIT 1`,
      [userId],
    ),
    database.query<ProgressRow[]>(
      'SELECT current_step,completed_at FROM user_onboarding_progress WHERE user_id=? LIMIT 1',
      [userId],
    ),
    database.query<AnswerRow[]>(
      'SELECT question_key,answer_order,answer_value FROM user_onboarding_answers WHERE user_id=? ORDER BY question_key,answer_order',
      [userId],
    ),
    database.query<TagRow[]>(
      `SELECT tag_kind,label FROM user_interest_tags
        WHERE user_id=? AND tag_kind IN ('profile_tag','preference') AND enabled=1
        ORDER BY sort_order,id`,
      [userId],
    ),
  ]);
  const row = profiles[0];
  if (!row) throw new ProfileRepositoryError(404, 'NOT_FOUND', '用户不存在');
  const profile = fallbackProfile(row.name, row.bio);
  profile.birthDate = row.birth_date ?? '';
  profile.gender = row.gender ?? '不透露';
  profile.education = row.education ?? '';
  profile.occupation = row.occupation ?? '';
  profile.height = row.height_cm ? `${row.height_cm}cm` : '';
  profile.city = [row.city, row.district].filter(Boolean).join(' ');
  profile.hometown = row.hometown ?? '';
  profile.relationship = row.relationship_status ?? '';
  profile.tags = tagRows.filter((tag) => tag.tag_kind === 'profile_tag').map((tag) => tag.label);
  profile.preferences = tagRows.filter((tag) => tag.tag_kind === 'preference').map((tag) => tag.label);

  const lightAnswers: string[][] = [[], [], []];
  const qaAnswers: Record<string, string> = {};
  for (const answer of answerRows) {
    const lightKeys = new Map([['light:intent', 0], ['light:scene', 1], ['light:barrier', 2], ['light:0', 0], ['light:1', 1], ['light:2', 2]]);
    const lightIndex = lightKeys.get(answer.question_key);
    if (lightIndex !== undefined) {
      const index = lightIndex;
      if (index >= 0 && index < lightAnswers.length) lightAnswers[index].push(answer.answer_value);
    } else {
      qaAnswers[answer.question_key] = answer.answer_value;
    }
  }
  const progress = progressRows[0];
  return {
    onboardingComplete: Boolean(progress?.completed_at),
    onboardingStep: Number(progress?.current_step ?? 0),
    lightAnswers,
    qaAnswers,
    profile,
  };
}

async function replaceAnswers(connection: QiahaoConnection, userId: string, record: ClubState, now: string): Promise<void> {
  await connection.query('DELETE FROM user_onboarding_answers WHERE user_id=?', [userId]);
  for (const [questionIndex, answers] of record.lightAnswers.entries()) {
    for (const [answerIndex, value] of answers.entries()) {
      await connection.query(
        `INSERT INTO user_onboarding_answers
          (user_id,question_key,answer_order,answer_value,updated_at)
         VALUES (?,?,?,?,?)`,
        [userId, ['light:intent', 'light:scene', 'light:barrier'][questionIndex], answerIndex, value, now],
      );
    }
  }
  for (const [key, value] of Object.entries(record.qaAnswers)) {
    await connection.query(
      `INSERT INTO user_onboarding_answers
        (user_id,question_key,answer_order,answer_value,updated_at)
       VALUES (?,?,?,?,?)`,
      [userId, /^basic:\d+$/.test(key) ? `qa:${key}` : key, 0, value, now],
    );
  }
}

async function replaceProfileTags(connection: QiahaoConnection, userId: string, profile: BasicProfile): Promise<void> {
  const now = toMysqlDateTime();
  await connection.query(
    `UPDATE user_interest_tags SET enabled=0,updated_at=?
      WHERE user_id=? AND tag_kind IN ('profile_tag','preference')`,
    [now, userId],
  );
  for (const [tagKind, values] of [['profile_tag', profile.tags], ['preference', profile.preferences]] as const) {
    for (const [index, value] of values.entries()) {
      await connection.query(
        `INSERT INTO user_interest_tags
          (user_id,tag_kind,label,sort_order,enabled,created_at,updated_at)
         VALUES (?,?,?,?,1,?,?)
         ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order),enabled=1,updated_at=VALUES(updated_at)`,
        [userId, tagKind, value, index, now, now],
      );
    }
  }
}

export async function saveProfileRecord(database: QiahaoDatabase, userId: string, record: ClubState): Promise<ClubState> {
  const now = toMysqlDateTime();
  const location = splitCity(record.profile.city);
  await validateProfileConfig(database, userId, record);
  await database.transaction(async (connection) => {
    await connection.query(
      'UPDATE users SET name=?,bio=?,updated_at=? WHERE id=?',
      [record.profile.nickname, record.profile.bio, now, userId],
    );
    await connection.query(
      `INSERT INTO user_profiles
        (user_id,birth_date,gender,education,occupation,height_cm,city,district,hometown,relationship_status,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         birth_date=VALUES(birth_date),gender=VALUES(gender),education=VALUES(education),occupation=VALUES(occupation),
         height_cm=VALUES(height_cm),city=VALUES(city),district=VALUES(district),hometown=VALUES(hometown),
         relationship_status=VALUES(relationship_status),updated_at=VALUES(updated_at)`,
      [
        userId,
        record.profile.birthDate || null,
        record.profile.gender,
        record.profile.education,
        record.profile.occupation,
        parseHeight(record.profile.height),
        location.city,
        location.district,
        record.profile.hometown,
        record.profile.relationship,
        now,
      ],
    );
    await connection.query(
      `INSERT INTO user_onboarding_progress
        (user_id,onboarding_version,current_step,completed_at,updated_at)
       VALUES (?,'v1',?,?,?)
       ON DUPLICATE KEY UPDATE current_step=VALUES(current_step),completed_at=VALUES(completed_at),updated_at=VALUES(updated_at)`,
      [userId, record.onboardingStep, record.onboardingComplete ? now : null, now],
    );
    await replaceAnswers(connection, userId, record, now);
    await replaceProfileTags(connection, userId, record.profile);
  });
  return getProfileRecord(database, userId);
}

async function validateProfileConfig(database: QiahaoDatabase, userId: string, record: ClubState): Promise<void> {
  const scalarValues = [
    ['gender', record.profile.gender],
    ['education', record.profile.education],
    ['relationship', record.profile.relationship],
  ] as const;
  for (const [group, value] of scalarValues) {
    if (!value) continue;
    const rows = await database.query<RowDataPacket[]>(
      'SELECT 1 FROM profile_option_configs WHERE group_key=? AND option_value=? AND enabled=1 LIMIT 1',
      [group, value],
    );
    if (!rows.length) {
      const column = group === 'relationship' ? 'relationship_status' : group;
      const historical = await database.query<RowDataPacket[]>(`SELECT 1 FROM user_profiles WHERE user_id=? AND ${column}=? LIMIT 1`, [userId, value]);
      if (!historical.length) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', `资料选项 ${value} 不存在或已停用`);
    }
  }
  for (const [group, values] of [['profile_tag', record.profile.tags], ['preference', record.profile.preferences]] as const) {
    for (const value of values) {
      const rows = await database.query<RowDataPacket[]>(
        'SELECT 1 FROM profile_option_configs WHERE group_key=? AND option_value=? AND enabled=1 LIMIT 1',
        [group, value],
      );
      if (!rows.length) {
        const historical = await database.query<RowDataPacket[]>('SELECT 1 FROM user_interest_tags WHERE user_id=? AND tag_kind=? AND label=? LIMIT 1', [userId, group, value]);
        if (!historical.length) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', `资料选项 ${value} 不存在或已停用`);
      }
    }
  }
  const questionKeys = ['light:intent', 'light:scene', 'light:barrier'];
  for (const [index, answers] of record.lightAnswers.entries()) {
    for (const answer of answers) {
      const rows = await database.query<RowDataPacket[]>(
        `SELECT 1 FROM onboarding_option_configs o
          JOIN onboarding_question_configs q ON q.id=o.question_id
         WHERE q.question_key=? AND q.enabled=1 AND o.answer_value=? AND o.enabled=1 LIMIT 1`,
        [questionKeys[index], answer],
      );
      if (!rows.length) {
        const historical = await database.query<RowDataPacket[]>('SELECT 1 FROM user_onboarding_answers WHERE user_id=? AND question_key=? AND answer_value=? LIMIT 1', [userId, questionKeys[index], answer]);
        if (!historical.length) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', `问卷选项 ${answer} 不存在或已停用`);
      }
    }
  }
}

export type InterestTagKind = 'profile_tag' | 'preference' | 'intent' | 'scene' | 'barrier';

export async function listInterestTags(database: QiahaoDatabase, userId: string, includeDisabled = false) {
  const rows = await database.query<Array<RowDataPacket & {
    id: number | string; tag_kind: InterestTagKind; label: string; source_key: string | null;
    sort_order: number | string; enabled: number | boolean; created_at: string; updated_at: string;
  }>>(
    `SELECT id,tag_kind,label,source_key,sort_order,enabled,created_at,updated_at
       FROM user_interest_tags WHERE user_id=? ${includeDisabled ? '' : 'AND enabled=1'}
      ORDER BY tag_kind,sort_order,id`,
    [userId],
  );
  return rows.map((row) => ({ id: String(row.id), kind: row.tag_kind, label: row.label, sourceKey: row.source_key, sortOrder: Number(row.sort_order), enabled: Boolean(row.enabled), createdAt: row.created_at, updatedAt: row.updated_at }));
}

async function validateInterestTagOption(database: QiahaoDatabase, kind: InterestTagKind, label: string): Promise<void> {
  const profileGroup = kind === 'profile_tag' || kind === 'preference' ? kind : null;
  const rows = profileGroup
    ? await database.query<RowDataPacket[]>('SELECT 1 FROM profile_option_configs WHERE group_key=? AND option_value=? AND enabled=1 LIMIT 1', [profileGroup, label])
    : await database.query<RowDataPacket[]>(
      `SELECT 1 FROM onboarding_option_configs o JOIN onboarding_question_configs q ON q.id=o.question_id
        WHERE q.question_key=? AND o.answer_value=? AND q.enabled=1 AND o.enabled=1 LIMIT 1`,
      [`light:${kind}`, label],
    );
  if (!rows.length) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', '兴趣标签不存在或已停用');
}

export async function createInterestTag(database: QiahaoDatabase, userId: string, input: { kind: InterestTagKind; label: string; sourceKey?: string; sortOrder?: number }) {
  await validateInterestTagOption(database, input.kind, input.label);
  const now = toMysqlDateTime();
  await database.query(
    `INSERT INTO user_interest_tags (user_id,tag_kind,label,source_key,sort_order,enabled,created_at,updated_at)
     VALUES (?,?,?,?,?,1,?,?)
     ON DUPLICATE KEY UPDATE source_key=VALUES(source_key),sort_order=VALUES(sort_order),enabled=1,updated_at=VALUES(updated_at)`,
    [userId, input.kind, input.label.trim(), input.sourceKey?.trim() || randomUUID(), input.sortOrder ?? 0, now, now],
  );
  const rows = await listInterestTags(database, userId, true);
  return rows.find((row) => row.kind === input.kind && row.label === input.label) ?? null;
}

export async function updateInterestTag(database: QiahaoDatabase, userId: string, id: string, input: { label?: string; sortOrder?: number; enabled?: boolean }) {
  const rows = await database.query<Array<RowDataPacket & { tag_kind: InterestTagKind; label: string; sort_order: number | string; enabled: number | boolean }>>(
    'SELECT tag_kind,label,sort_order,enabled FROM user_interest_tags WHERE id=? AND user_id=? LIMIT 1',
    [id, userId],
  );
  const current = rows[0];
  if (!current) return null;
  const label = input.label?.trim() || current.label;
  if (label !== current.label) await validateInterestTagOption(database, current.tag_kind, label);
  await database.query(
    'UPDATE user_interest_tags SET label=?,sort_order=?,enabled=?,updated_at=? WHERE id=? AND user_id=?',
    [label, input.sortOrder ?? Number(current.sort_order), input.enabled ?? Boolean(current.enabled), toMysqlDateTime(), id, userId],
  );
  return (await listInterestTags(database, userId, true)).find((row) => row.id === id) ?? null;
}

export async function disableInterestTag(database: QiahaoDatabase, userId: string, id: string): Promise<boolean> {
  const result = await database.query<ResultSetHeader>(
    'UPDATE user_interest_tags SET enabled=0,updated_at=? WHERE id=? AND user_id=?',
    [toMysqlDateTime(), id, userId],
  );
  return result.affectedRows > 0;
}

export async function getOnboardingRecord(database: QiahaoDatabase, userId: string) {
  const [progressRows, answerRows] = await Promise.all([
    database.query<Array<RowDataPacket & { onboarding_version: string; current_step: number | string; completed_at: string | null; updated_at: string }>>(
      'SELECT onboarding_version,current_step,completed_at,updated_at FROM user_onboarding_progress WHERE user_id=? LIMIT 1',
      [userId],
    ),
    database.query<Array<RowDataPacket & { question_key: string; answer_order: number | string; answer_value: string; updated_at: string }>>(
      'SELECT question_key,answer_order,answer_value,updated_at FROM user_onboarding_answers WHERE user_id=? ORDER BY question_key,answer_order',
      [userId],
    ),
  ]);
  return { progress: progressRows[0] ?? { onboarding_version: 'v1', current_step: 0, completed_at: null, updated_at: null }, answers: answerRows };
}

export async function replaceOnboardingAnswers(
  database: QiahaoDatabase,
  userId: string,
  input: { answers: Record<string, string[]>; currentStep: number; completed: boolean },
) {
  if (!Number.isInteger(input.currentStep) || input.currentStep < 0 || input.currentStep > 3) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', '问卷步骤无效');
  const config = await database.query<Array<RowDataPacket & { question_key: string; input_type: 'single' | 'multiple' | 'text'; required_flag: number | boolean; max_selections: number | string | null }>>(
    'SELECT question_key,input_type,required_flag,max_selections FROM onboarding_question_configs WHERE enabled=1',
  );
  const byKey = new Map(config.map((question) => [question.question_key, question]));
  for (const [key, values] of Object.entries(input.answers)) {
    const question = byKey.get(key);
    if (!question || !Array.isArray(values) || values.some((value) => typeof value !== 'string' || value.length > 5000)) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', '问卷答案格式无效');
    if (question.max_selections !== null && values.length > Number(question.max_selections)) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', '问卷选项超过允许数量');
    if (question.input_type !== 'text') {
      for (const value of values) {
        const options = await database.query<RowDataPacket[]>(
          `SELECT 1 FROM onboarding_option_configs o JOIN onboarding_question_configs q ON q.id=o.question_id
            WHERE q.question_key=? AND o.answer_value=? AND o.enabled=1 LIMIT 1`,
          [key, value],
        );
        if (!options.length) throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', '问卷选项不存在或已停用');
      }
    }
  }
  if (input.completed) {
    for (const question of config) {
      if (Boolean(question.required_flag) && !(input.answers[question.question_key] ?? []).some((value) => value.trim())) {
        throw new ProfileRepositoryError(400, 'VALIDATION_ERROR', `必答题 ${question.question_key} 尚未完成`);
      }
    }
  }
  const now = toMysqlDateTime();
  await database.transaction(async (connection) => {
    await connection.query('DELETE FROM user_onboarding_answers WHERE user_id=?', [userId]);
    for (const [questionKey, values] of Object.entries(input.answers)) {
      for (const [answerOrder, answerValue] of values.entries()) {
        await connection.query(
          'INSERT INTO user_onboarding_answers (user_id,question_key,answer_order,answer_value,updated_at) VALUES (?,?,?,?,?)',
          [userId, questionKey, answerOrder, answerValue.trim(), now],
        );
      }
    }
    await connection.query(
      `INSERT INTO user_onboarding_progress (user_id,onboarding_version,current_step,completed_at,updated_at)
       VALUES (?,'v1',?,?,?)
       ON DUPLICATE KEY UPDATE current_step=VALUES(current_step),completed_at=VALUES(completed_at),updated_at=VALUES(updated_at)`,
      [userId, input.currentStep, input.completed ? now : null, now],
    );
  });
  return getOnboardingRecord(database, userId);
}

export async function deleteOnboardingAnswers(database: QiahaoDatabase, userId: string): Promise<void> {
  await database.transaction(async (connection) => {
    await connection.query('DELETE FROM user_onboarding_answers WHERE user_id=?', [userId]);
    await connection.query('DELETE FROM user_onboarding_progress WHERE user_id=?', [userId]);
  });
}
