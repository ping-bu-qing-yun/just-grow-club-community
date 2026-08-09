import type { RowDataPacket } from 'mysql2/promise';
import type { ApiActivity } from '../src/api/types';
import type { RecommendationRuleConfig } from '../src/config/types';
import { getActivity } from './activity-repository';
import { BusinessConfigService } from './config-service';
import type { QiahaoDatabase } from './db';

type Weights = {
  intent: number; scene: number; profile: number; theme: number; formal: number; pre: number;
  city: number; joinedPenalty: number;
};

const safeWeights: Weights = { intent: 35, scene: 30, profile: 15, theme: 8, formal: 10, pre: 4, city: 3, joinedPenalty: 18 };
const safeColdStart = { formal: 50, pre: 42 };
const safeThresholds = [{ min: 80, label: '很适合你' }, { min: 60, label: '值得看看' }, { min: 0, label: '可以了解' }];

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numericSettings(value: unknown, fallback: Weights): Weights {
  const input = objectValue(value);
  return Object.fromEntries(Object.entries(fallback).map(([key, defaultValue]) => {
    const candidate = Number(input[key]);
    return [key, Number.isFinite(candidate) && candidate >= 0 && candidate <= 100 ? candidate : defaultValue];
  })) as Weights;
}

function numericPair(value: unknown, fallback: { formal: number; pre: number }): { formal: number; pre: number } {
  const input = objectValue(value);
  return {
    formal: boundedScore(input.formal, fallback.formal),
    pre: boundedScore(input.pre, fallback.pre),
  };
}

function boundedScore(value: unknown, fallback: number): number {
  const candidate = Number(value);
  return Number.isFinite(candidate) && candidate >= 0 && candidate <= 100 ? candidate : fallback;
}

function tokenHits(rules: RecommendationRuleConfig[], blob: string): { hits: number; rules: RecommendationRuleConfig[]; themes: Set<string> } {
  const matched: RecommendationRuleConfig[] = [];
  const themes = new Set<string>();
  let hits = 0;
  for (const rule of rules) {
    const ruleHits = rule.tokens.filter((token) => blob.includes(token.trim().toLowerCase())).length;
    if (ruleHits === 0) continue;
    hits += ruleHits;
    matched.push(rule);
    rule.themes.forEach((theme) => themes.add(theme));
  }
  return { hits, rules: matched, themes };
}

function thresholdLabel(score: number, value: unknown, fallback: string): string {
  const thresholds = Array.isArray(value) ? value
    .map((item) => objectValue(item))
    .map((item) => ({ min: Number(item.min), label: String(item.label ?? '') }))
    .filter((item) => Number.isFinite(item.min) && item.label)
    .sort((a, b) => b.min - a.min) : safeThresholds;
  return thresholds.find((item) => score >= item.min)?.label ?? fallback;
}

export async function recommendActivities(
  database: QiahaoDatabase,
  configService: BusinessConfigService,
  userId: string,
  limit = 10,
) {
  const [config, activityRows, answerRows, tagRows, profileRows, joinedRows] = await Promise.all([
    configService.getBootstrap(),
    database.query<Array<RowDataPacket & { id: string }>>(
      `SELECT a.id FROM activities a JOIN content_items ci ON ci.id=a.id
        WHERE ci.status='approved' AND a.lifecycle<>'archived'
        ORDER BY a.featured DESC,a.created_at DESC,a.id DESC`,
    ),
    database.query<Array<RowDataPacket & { question_key: string; answer_value: string }>>(
      'SELECT question_key,answer_value FROM user_onboarding_answers WHERE user_id=?',
      [userId],
    ),
    database.query<Array<RowDataPacket & { tag_kind: string; label: string }>>(
      'SELECT tag_kind,label FROM user_interest_tags WHERE user_id=? AND enabled=1',
      [userId],
    ),
    database.query<Array<RowDataPacket & { city: string }>>('SELECT city FROM user_profiles WHERE user_id=? LIMIT 1', [userId]),
    database.query<Array<RowDataPacket & { activity_id: string }>>(
      "SELECT activity_id FROM activity_members WHERE user_id=? AND status IN ('interested','joined')",
      [userId],
    ),
  ]);
  const rulesByTerm = new Map(config.recommendation.rules.map((rule) => [rule.sourceTerm, rule]));
  const groups = { intent: [] as RecommendationRuleConfig[], scene: [] as RecommendationRuleConfig[], profile: [] as RecommendationRuleConfig[] };
  for (const answer of answerRows) {
    const rule = rulesByTerm.get(answer.answer_value);
    if (!rule) continue;
    if (answer.question_key === 'light:intent') groups.intent.push(rule);
    else if (answer.question_key === 'light:scene' || answer.question_key === 'light:barrier') groups.scene.push(rule);
    else groups.profile.push(rule);
  }
  for (const tag of tagRows) {
    const rule = rulesByTerm.get(tag.label);
    if (!rule) continue;
    if (tag.tag_kind === 'intent') groups.intent.push(rule);
    else if (tag.tag_kind === 'scene' || tag.tag_kind === 'barrier') groups.scene.push(rule);
    else groups.profile.push(rule);
  }
  const settings = new Map(config.recommendation.settings.map((setting) => [setting.key, setting.value]));
  const weights = numericSettings(settings.get('weights'), safeWeights);
  const cold = numericPair(settings.get('cold_start'), safeColdStart);
  const joined = new Set(joinedRows.map((row) => row.activity_id));
  const activities = (await Promise.all(activityRows.map((row) => getActivity(database, userId, row.id)))).filter((item): item is ApiActivity => item !== null);
  const signalCount = groups.intent.length + groups.scene.length + groups.profile.length;
  const ranked = activities.map((activity) => {
    const blob = [activity.title, activity.description, activity.location, activity.category, ...(activity.tags ?? []).flatMap((tag) => [tag.label, tag.slug])]
      .join(' ').toLowerCase();
    const intent = tokenHits(groups.intent, blob);
    const scene = tokenHits(groups.scene, blob);
    const profile = tokenHits(groups.profile, blob);
    const preferredThemes = new Set([...intent.themes, ...scene.themes, ...profile.themes]);
    const category = config.activityCategories.find((item) => item.key === activity.categoryKey);
    let score = 0;
    score += Math.min(1, intent.hits / Math.max(3, groups.intent.length || 1)) * weights.intent;
    score += Math.min(1, scene.hits / Math.max(3, groups.scene.length || 1)) * weights.scene;
    score += Math.min(1, profile.hits / Math.max(3, groups.profile.length || 1)) * weights.profile;
    if (category && preferredThemes.has(category.themeKey)) score += weights.theme;
    score += activity.lifecycle === 'formal' ? weights.formal : weights.pre;
    if (profileRows[0]?.city && activity.location.includes(profileRows[0].city)) score += weights.city;
    if (joined.has(activity.id)) score -= weights.joinedPenalty;
    if (signalCount === 0) score = Number(activity.lifecycle === 'formal' ? cold.formal : cold.pre);
    score = Math.max(0, Math.min(100, Math.round(score)));
    const matchedRules = [...intent.rules, ...scene.rules, ...profile.rules];
    const reasons = [...new Set(matchedRules.map((rule) => rule.reasonText || rule.sourceTerm))].slice(0, 3);
    return {
      activity,
      score,
      matchedTags: [...new Set(matchedRules.map((rule) => rule.sourceTerm))],
      reasons: reasons.length ? reasons : ['根据当前活动状态给出的安全推荐'],
      matchLabel: thresholdLabel(score, settings.get('thresholds'), activity.matchLabel ?? '可以了解'),
    };
  }).sort((a, b) => b.score - a.score || a.activity.id.localeCompare(b.activity.id));
  return { version: config.versions.recommendation, items: ranked.slice(0, Math.max(1, Math.min(50, limit))) };
}
