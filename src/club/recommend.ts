import type { ClubActivity } from './types';
import { activitySearchBlob, expandUserTerms, normalizeToken } from './match-lexicon';
import type { UserPortrait } from './portrait';

export type RankedActivity = {
  activity: ClubActivity;
  score: number;
  reasons: string[];
  matchLabel: string;
};

export type RankOptions = {
  limit?: number;
  /** 已报名等：降权但不一定剔除 */
  penalizeIds?: string[];
  /** 完全排除 */
  excludeIds?: string[];
};

function countTokenHits(tokens: Set<string>, blob: string, fields: string[]): { hits: number; matched: string[] } {
  let hits = 0;
  const matched: string[] = [];
  for (const token of tokens) {
    if (!token || token.length < 2) continue;
    const inBlob = blob.includes(token);
    const inFields = fields.some((field) => normalizeToken(field).includes(token) || token.includes(normalizeToken(field)));
    if (inBlob || inFields) {
      hits += 1;
      if (matched.length < 4) matched.push(token);
    }
  }
  return { hits, matched };
}

function labelForScore(score: number, fallback: string): string {
  if (score >= 75) return '高匹配';
  if (score >= 55) return '较匹配';
  if (score >= 40) return fallback || '可看看';
  return fallback || '可看看';
}

function reasonFrom(matched: string[], portrait: UserPortrait): string[] {
  const pool = [...portrait.barriers, ...portrait.scenes, ...portrait.intents, ...portrait.profileTags];
  const reasons: string[] = [];
  for (const term of pool) {
    const n = normalizeToken(term);
    if (matched.some((m) => m.includes(n) || n.includes(m) || m === n)) {
      reasons.push(term);
    }
    if (reasons.length >= 2) break;
  }
  if (!reasons.length && matched.length) {
    reasons.push(matched[0]);
  }
  return reasons.slice(0, 2);
}

/**
 * 方案 A：标签权重匹配。
 * 分数约 0–100，便于 UI 与阈值。
 */
export function scoreClubActivity(
  portrait: UserPortrait,
  activity: ClubActivity,
  opts?: { penalizeIds?: string[] },
): RankedActivity {
  const intentExp = expandUserTerms(portrait.intents);
  const sceneExp = expandUserTerms([...portrait.scenes, ...portrait.barriers]);
  const profileExp = expandUserTerms([...portrait.profileTags, ...portrait.preferences]);

  const blob = activitySearchBlob(activity);
  const needFields = activity.needs;
  const tagFields = activity.tags;

  const intentHit = countTokenHits(intentExp.tokens, blob, needFields);
  const sceneHit = countTokenHits(sceneExp.tokens, blob, [...tagFields, ...needFields]);
  const profileHit = countTokenHits(profileExp.tokens, blob, tagFields);

  const intentDenom = Math.max(3, portrait.intents.length || 1);
  const sceneDenom = Math.max(3, portrait.scenes.length + portrait.barriers.length || 1);
  const profileDenom = Math.max(3, portrait.profileTags.length + portrait.preferences.length || 1);

  let score = 0;
  score += Math.min(1, intentHit.hits / intentDenom) * 35;
  score += Math.min(1, sceneHit.hits / sceneDenom) * 30;
  score += Math.min(1, profileHit.hits / profileDenom) * 15;

  const preferredThemes = new Set([...intentExp.themes, ...sceneExp.themes, ...profileExp.themes]);
  if (preferredThemes.has(activity.theme)) score += 8;

  if (activity.status === '成熟活动') score += 10;
  else score += 4; // 预活动可推但略降

  if (portrait.city && activity.location.includes('附近')) {
    // 粗信号：用户有城市且活动标附近
    score += 3;
  }

  const penalize = new Set(opts?.penalizeIds ?? []);
  if (penalize.has(activity.id)) score -= 18;

  // 冷启动：几乎无问答时给中性分，保持 seed 相对顺序靠稳定性
  const signal =
    portrait.intents.length + portrait.scenes.length + portrait.barriers.length + portrait.profileTags.length + portrait.preferences.length;
  if (signal === 0) {
    score = activity.status === '成熟活动' ? 50 : 42;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const matched = [...intentHit.matched, ...sceneHit.matched, ...profileHit.matched];
  const reasons = reasonFrom(matched, portrait);
  const prettyReasons = reasons.map((r) => (r.length > 12 ? r.slice(0, 12) : r));

  return {
    activity,
    score,
    reasons: prettyReasons,
    matchLabel: labelForScore(score, activity.matchLabel),
  };
}

export function rankClubActivities(
  portrait: UserPortrait,
  activities: ClubActivity[],
  opts: RankOptions = {},
): RankedActivity[] {
  const exclude = new Set(opts.excludeIds ?? []);
  const ranked = activities
    .filter((activity) => !exclude.has(activity.id))
    .map((activity) => scoreClubActivity(portrait, activity, { penalizeIds: opts.penalizeIds }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // 稳定：成熟优先，再按原 title
      if (a.activity.status !== b.activity.status) {
        return a.activity.status === '成熟活动' ? -1 : 1;
      }
      return a.activity.id.localeCompare(b.activity.id);
    });

  return typeof opts.limit === 'number' ? ranked.slice(0, opts.limit) : ranked;
}
