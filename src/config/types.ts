export type ConfigDomain =
  | 'activity-categories'
  | 'onboarding'
  | 'profile-options'
  | 'feedback-options'
  | 'recommendation';

export interface ConfigVersionMap {
  'activity-categories': number;
  onboarding: number;
  'profile-options': number;
  'feedback-options': number;
  recommendation: number;
}

export interface ActivityCategoryConfig {
  key: string;
  label: string;
  themeKey: string;
  iconKey: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface OnboardingOptionConfig {
  key: string;
  label: string;
  value: string;
  enabled: boolean;
  sortOrder: number;
}

export interface OnboardingQuestionConfig {
  key: string;
  sectionKey: string;
  prompt: string;
  inputType: 'single' | 'multiple' | 'text';
  required: boolean;
  maxSelections: number | null;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
  options: OnboardingOptionConfig[];
}

export interface ProfileOptionConfig {
  groupKey: string;
  key: string;
  label: string;
  value: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface FeedbackOptionConfig {
  groupKey: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface RecommendationRuleConfig {
  key: string;
  sourceTerm: string;
  themes: string[];
  tokens: string[];
  reasonText: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface RecommendationSettingConfig {
  key: string;
  value: unknown;
  description: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface RecommendationConfig {
  rules: RecommendationRuleConfig[];
  settings: RecommendationSettingConfig[];
}

export interface BusinessConfigBootstrap {
  versions: ConfigVersionMap;
  activityCategories: ActivityCategoryConfig[];
  onboarding: OnboardingQuestionConfig[];
  profileOptions: ProfileOptionConfig[];
  feedbackOptions: FeedbackOptionConfig[];
  recommendation: RecommendationConfig;
}

export type ConfigEntityType =
  | 'activity-category'
  | 'onboarding-question'
  | 'onboarding-option'
  | 'profile-option'
  | 'feedback-option'
  | 'recommendation-rule'
  | 'recommendation-setting';

export interface ConfigAuditEvent {
  id: string;
  revision: number;
  domain: ConfigDomain;
  entityType: ConfigEntityType;
  entityKey: string;
  action: 'created' | 'updated' | 'disabled' | 'restored' | 'deleted';
  actorId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface OperatorConfigMutation {
  entityType: ConfigEntityType;
  key: string;
  expectedRevision: number;
  values?: Record<string, unknown>;
}
