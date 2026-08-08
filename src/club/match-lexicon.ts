import type { ClubActivity } from './types';

/** 用户选项/标签 → 可命中的活动侧词（tags/needs 子串或整词）与 theme */
export type LexiconEntry = {
  themes?: Array<ClubActivity['theme']>;
  tokens: string[];
};

/**
 * lightQuestions 选项 + 常见 profile 标签的对齐词典。
 * tokens 会与 activity.tags / needs / title / description 做包含匹配（小写）。
 */
export const USER_TERM_LEXICON: Record<string, LexiconEntry> = {
  // intents
  想认识靠谱的人: { themes: ['low'], tokens: ['想认识靠谱的人', '低压力', '少人数', '自然聊天', '靠谱'] },
  想自然一点脱单: { themes: ['low', 'deep'], tokens: ['自然', '不强相亲', '慢了解', '脱单', '关系'] },
  想找能深聊的人: { themes: ['deep'], tokens: ['想找能深聊的人', 'deep talk', '价值观', '深聊', '夜谈'] },
  想扩大线下社交圈: { themes: ['low', 'walk', 'other'], tokens: ['轻社交', '社交', '附近', '散步', '看展'] },
  想理解关系模式: { themes: ['workshop', 'deep'], tokens: ['想理解关系模式', '关系模式', '工作坊', '关系'] },
  暂时不确定: { themes: ['low'], tokens: ['低压力', '轻社交', '少人数'] },

  // scenes
  少人数饭局: { themes: ['low'], tokens: ['少人数', '低压力', '饭', '晚餐', '轻餐', '小桌'] },
  轻松散步: { themes: ['walk'], tokens: ['散步', '轻社交', '户外', '走'] },
  '主题 deep talk': { themes: ['deep'], tokens: ['deep talk', '价值观', '深聊', '对谈'] },
  共同兴趣活动: { themes: ['other', 'walk'], tokens: ['看展', '文艺', '兴趣', '骑行', '运动'] },
  关系工作坊: { themes: ['workshop'], tokens: ['工作坊', '关系模式', '练习'] },
  小组匹配: { themes: ['low', 'workshop'], tokens: ['少人数', '小组', '匹配', '低压力'] },

  // barriers
  怕尴尬: { themes: ['low'], tokens: ['怕尴尬', '低压力', '少人数', '自然聊天'] },
  怕人多: { themes: ['low', 'deep'], tokens: ['少人数', '低压力', '小桌', '5人', '6人', '4人'] },
  怕太像相亲: { themes: ['low', 'deep', 'walk'], tokens: ['不强相亲', '低压力', '自然', '轻社交'] },
  怕聊不起来: { themes: ['low', 'workshop'], tokens: ['低压力', '流程', '破冰', '少人数'] },
  地点太远: { tokens: ['附近', '午间'] },
  不知道来的人怎样: { themes: ['low', 'workshop'], tokens: ['低压力', '边界', '少人数', '靠谱'] },

  // profile defaults / common
  喜欢深聊: { themes: ['deep'], tokens: ['deep talk', '深聊', '价值观', '慢聊'] },
  周末散步: { themes: ['walk'], tokens: ['散步', '周末', '户外', '轻社交'] },
  慢热: { themes: ['low', 'deep'], tokens: ['低压力', '慢了解', '慢聊', '少人数'] },
  喝杯咖啡: { themes: ['low', 'other'], tokens: ['咖啡', '轻社交', '慢聊'] },
  看展: { themes: ['other'], tokens: ['看展', '文艺'] },
  户外运动: { themes: ['walk'], tokens: ['户外', '骑行', '轻运动', '散步'] },
  附近: { tokens: ['附近'] },
  自然聊天: { themes: ['low'], tokens: ['自然聊天', '低压力', '少人数'] },
};

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

/** 把用户词展开为可匹配 token + theme 偏好 */
export function expandUserTerms(terms: string[]): { tokens: Set<string>; themes: Set<ClubActivity['theme']> } {
  const tokens = new Set<string>();
  const themes = new Set<ClubActivity['theme']>();
  for (const term of terms) {
    const key = term.trim();
    if (!key) continue;
    tokens.add(normalizeToken(key));
    const entry = USER_TERM_LEXICON[key];
    if (entry) {
      for (const t of entry.tokens) tokens.add(normalizeToken(t));
      for (const th of entry.themes ?? []) themes.add(th);
    }
  }
  return { tokens, themes };
}

export function activitySearchBlob(activity: ClubActivity): string {
  return normalizeToken(
    [activity.title, activity.description, activity.pitch, activity.location, ...activity.tags, ...activity.needs, activity.people].join(
      ' ',
    ),
  );
}
