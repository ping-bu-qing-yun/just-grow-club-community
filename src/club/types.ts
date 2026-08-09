export interface BasicProfile {
  nickname: string;
  birthDate: string;
  gender: string;
  education: string;
  occupation: string;
  height: string;
  city: string;
  hometown: string;
  relationship: string;
  bio: string;
  tags: string[];
  preferences: string[];
}

export interface Need {
  id: string;
  author: string;
  subtitle: string;
  tags: string[];
  title: string;
  copy: string;
  image: string;
  resonance: number;
  saved?: boolean;
  resonated?: boolean;
  comments: number;
  response: string;
  /** 关联的俱乐部活动；有值 = 有活动回应，可跳转查看 */
  responseActivityId?: string;
  similar?: boolean;
}

export interface LifePost {
  id: string;
  author: string;
  meta: string;
  kind: string;
  text: string;
  images: string[];
  tag: string;
  comments: number;
  resonance: number;
  saved?: boolean;
  resonated?: boolean;
}

export interface ClubActivityFlowStep {
  title: string;
  body: string;
}

export interface ClubActivity {
  id: string;
  theme: 'low' | 'deep' | 'walk' | 'workshop' | 'other';
  status: '成熟活动' | '预活动';
  title: string;
  tags: string[];
  description: string;
  image: string;
  date: string;
  location: string;
  people: string;
  fee: string;
  /** 详情：解决需求 */
  needs: string[];
  /** 详情：完整时间段，如「周五 19:30-21:30」 */
  timeRange: string;
  /** 详情：来的人 */
  audience: string;
  /** 详情：活动怎么进行 */
  flow: ClubActivityFlowStep[];
  /** 详情：参与边界 */
  boundary: string;
  /** 详情：hero/简介副文案 */
  pitch: string;
  /** 详情：匹配标签，如「高匹配」 */
  matchLabel: string;
}

export interface ClubState {
  onboardingComplete: boolean;
  onboardingStep: number;
  lightAnswers: string[][];
  qaAnswers: Record<string, string>;
  profile: BasicProfile;
}
