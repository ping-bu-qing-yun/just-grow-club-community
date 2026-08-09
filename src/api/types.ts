import type { Activity, CreateActivityInput, MessageThread, UserRole, UserSummary } from '../domain/types';
import type { ClubState } from '../club/types';
import type {
  BusinessConfigBootstrap,
  ConfigAuditEvent,
  ConfigDomain,
  ConfigEntityType,
  FeedbackOptionConfig,
  OnboardingQuestionConfig,
  ProfileOptionConfig,
  RecommendationConfig,
  ActivityCategoryConfig,
} from '../config/types';

export type ContentType = 'activity' | 'need' | 'life';
export type CommentContentType = ContentType;
export type ContentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived' | 'hidden';
export interface CursorPage { nextCursor: string | null; }
export interface ActivityListParams {
  cursor?: string | null;
  limit?: number;
  q?: string;
  category?: string;
  theme?: 'low' | 'deep' | 'walk' | 'workshop' | 'other';
  lifecycle?: 'pre' | 'formal';
}
export interface ContentListParams { cursor?: string | null; limit?: number; q?: string; }
export interface ApiContentTag { id: string; contentType: ContentType; slug: string; label: string; enabled: boolean; }
export interface ApiUser extends UserSummary { phone: string; role: UserRole; }
export interface ApiActivity extends Activity {
  saved: boolean;
  joined: boolean;
  status?: ContentStatus;
  tags?: ApiContentTag[];
  /** 评论总数由服务端按未删除评论计算。旧响应缺失时按 0 兼容。 */
  commentCount?: number;
  comments?: number;
}
export interface ApiNeed {
  id: string;
  body: string;
  author: UserSummary;
  tags: ApiContentTag[];
  status: ContentStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  comments?: number;
  saved: boolean;
  resonated: boolean;
  resonanceCount: number;
}
export interface ApiLifePost {
  id: string;
  body: string;
  image?: string | null;
  author: UserSummary;
  tags: ApiContentTag[];
  status: ContentStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
  comments?: number;
  saved: boolean;
  resonated: boolean;
  resonanceCount: number;
}

export interface ApiComment {
  id: string;
  contentType: CommentContentType;
  contentId: string;
  author: UserSummary;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommentPage {
  comments: ApiComment[];
  total: number;
  nextCursor: string | null;
}
export interface AdminContentItem {
  id: string;
  contentType: ContentType;
  status: ContentStatus;
  author: UserSummary;
  title: string;
  body: string;
  category?: string | null;
  image?: string | null;
  tags: ApiContentTag[];
  reviewedBy?: UserSummary | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ApiThread extends MessageThread { }
export interface ApiMessage {
  id: string;
  threadId: string;
  senderId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  withdrawn: boolean;
}
export interface ApiActivityFeedback {
  id: string;
  mood: string;
  moodLabel?: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}
export interface ApiContentMedia {
  id: string;
  contentId: string;
  contentType: ContentType;
  type: 'image';
  url: string;
  altText: string;
  sortOrder: number;
  createdAt: string;
}
export interface ApiInterestTag {
  id: string;
  kind: 'profile_tag' | 'preference' | 'intent' | 'scene' | 'barrier';
  label: string;
  sourceKey: string | null;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ApiOnboardingRecord {
  progress: { onboarding_version: string; current_step: number | string; completed_at: string | null; updated_at: string | null };
  answers: Array<{ question_key: string; answer_order: number | string; answer_value: string; updated_at: string }>;
}
export interface ApiRecommendation {
  activity: ApiActivity;
  score: number;
  matchedTags: string[];
  reasons: string[];
  matchLabel: string;
}
export type ActivityProposalStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
export interface ApiActivityProposal {
  id: string;
  host: { id: string; name: string };
  sourceNeedId: string | null;
  title: string;
  categoryKey: string;
  categoryLabel: string;
  description: string;
  status: ActivityProposalStatus;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface QiahaoApi {
  login(phone: string, password: string): Promise<{ user: ApiUser }>;
  logout(): Promise<void>;
  me(): Promise<{ user: ApiUser }>;
  profile(): Promise<{ profile: ClubState }>;
  saveProfile(profile: ClubState): Promise<{ profile: ClubState }>;
  activities(input?: ActivityListParams): Promise<{ activities: ApiActivity[] } & CursorPage>;
  activity(id: string): Promise<{ activity: ApiActivity }>;
  createActivity(input: CreateActivityInput): Promise<{ activity: ApiActivity }>;
  updateActivity(id: string, input: Partial<CreateActivityInput>): Promise<{ activity: ApiActivity }>;
  archiveActivity(id: string, reason?: string): Promise<void>;
  changeActivityLifecycle(id: string, lifecycle: 'formal' | 'archived'): Promise<{ id: string; lifecycle: 'formal' | 'archived' }>;
  needs(input?: ContentListParams): Promise<{ needs: ApiNeed[] } & CursorPage>;
  need(id: string): Promise<{ need: ApiNeed }>;
  createNeed(body: string, tags?: string[]): Promise<{ need: ApiNeed }>;
  updateNeed(id: string, body: string, tags?: string[]): Promise<{ need: ApiNeed }>;
  archiveNeed(id: string): Promise<void>;
  lifePosts(input?: ContentListParams): Promise<{ lifePosts: ApiLifePost[] } & CursorPage>;
  lifePost(id: string): Promise<{ lifePost: ApiLifePost }>;
  createLifePost(body: string, image?: string, tags?: string[]): Promise<{ lifePost: ApiLifePost }>;
  updateLifePost(id: string, body: string, image?: string, tags?: string[]): Promise<{ lifePost: ApiLifePost }>;
  archiveLifePost(id: string): Promise<void>;
  adminContent(filters?: { type?: ContentType; status?: ContentStatus; tag?: string }): Promise<{ items: AdminContentItem[] }>;
  updateContentStatus(id: string, status: Exclude<ContentStatus, 'draft'>, reason?: string): Promise<{ item: AdminContentItem }>;
  adminTags(type?: ContentType): Promise<{ tags: ApiContentTag[] }>;
  tags(type?: ContentType): Promise<{ tags: ApiContentTag[] }>;
  createTag(input: { type: ContentType; slug: string; label: string }): Promise<{ tag: ApiContentTag }>;
  updateTag(id: string, input: { slug?: string; label?: string; enabled?: boolean }): Promise<{ tag: ApiContentTag }>;
  disableTag(id: string): Promise<{ tag: ApiContentTag }>;
  restoreTag(id: string): Promise<{ tag: ApiContentTag }>;
  favorite(id: string, saved: boolean): Promise<{ saved: boolean }>;
  bookmark(contentType: ContentType, id: string, saved: boolean): Promise<{ saved: boolean }>;
  resonate(contentType: ContentType, id: string, resonated: boolean): Promise<{ resonated: boolean }>;
  socialState(contentType: ContentType, id: string): Promise<{ saved: boolean; resonated: boolean; resonanceCount: number }>;
  join(id: string): Promise<{ thread: ApiThread | null; participationStatus: 'interested' | 'joined' }>;
  cancelJoin(id: string): Promise<{ participationStatus: null }>;
  setActivityInterest(id: string, signal: 'consider' | 'not_interested', reason?: string): Promise<{ signal: 'consider' | 'not_interested' }>;
  submitActivityFeedback(id: string, mood: string, note: string): Promise<{ feedback: ApiActivityFeedback }>;
  activityFeedback(id: string): Promise<{ feedback: ApiActivityFeedback }>;
  updateActivityFeedback(id: string, input: { mood?: string; note?: string }): Promise<{ feedback: ApiActivityFeedback }>;
  withdrawActivityFeedback(id: string): Promise<void>;
  threads(): Promise<{ threads: ApiThread[] }>;
  messages(threadId: string): Promise<{ messages: ApiMessage[] }>;
  sendMessage(threadId: string, body: string): Promise<{ message: ApiMessage }>;
  withdrawMessage(messageId: string): Promise<void>;
  onboardingAnswers(): Promise<ApiOnboardingRecord>;
  saveOnboardingAnswers(input: { answers: Record<string, string[]>; currentStep: number; completed: boolean }): Promise<ApiOnboardingRecord>;
  deleteOnboardingAnswers(): Promise<void>;
  interestTags(): Promise<{ tags: ApiInterestTag[] }>;
  createInterestTag(input: Omit<ApiInterestTag, 'id' | 'sourceKey' | 'enabled' | 'createdAt' | 'updatedAt'> & { sourceKey?: string }): Promise<{ tag: ApiInterestTag | null }>;
  updateInterestTag(id: string, input: { label?: string; sortOrder?: number; enabled?: boolean }): Promise<{ tag: ApiInterestTag }>;
  disableInterestTag(id: string): Promise<void>;
  media(contentId: string): Promise<{ media: ApiContentMedia[] }>;
  createMedia(contentId: string, input: { url: string; altText?: string; sortOrder?: number }): Promise<{ media: ApiContentMedia }>;
  updateMedia(mediaId: string, input: { url?: string; altText?: string; sortOrder?: number }): Promise<{ media: ApiContentMedia }>;
  deleteMedia(mediaId: string): Promise<void>;
  configBootstrap(): Promise<BusinessConfigBootstrap>;
  activityCategoryConfig(): Promise<{ version: number; items: ActivityCategoryConfig[] }>;
  onboardingConfig(): Promise<{ version: number; questions: OnboardingQuestionConfig[] }>;
  profileOptionConfig(): Promise<{ version: number; items: ProfileOptionConfig[] }>;
  feedbackOptionConfig(): Promise<{ version: number; items: FeedbackOptionConfig[] }>;
  recommendationConfig(): Promise<{ version: number } & RecommendationConfig>;
  recommendations(limit?: number): Promise<{ version: number; items: ApiRecommendation[] }>;
  operatorConfig(domain: ConfigDomain): Promise<{ domain: ConfigDomain; version: number; config: unknown }>;
  operatorConfigAudit(domain: ConfigDomain, limit?: number): Promise<{ events: ConfigAuditEvent[] }>;
  createOperatorConfig(domain: ConfigDomain, input: { entityType: ConfigEntityType; key: string; expectedRevision: number; values?: Record<string, unknown> }): Promise<{ revision: number; entity: Record<string, unknown> }>;
  updateOperatorConfig(domain: ConfigDomain, key: string, input: { entityType: ConfigEntityType; expectedRevision: number; values?: Record<string, unknown> }): Promise<{ revision: number; entity: Record<string, unknown> }>;
  disableOperatorConfig(domain: ConfigDomain, key: string, input: { entityType: ConfigEntityType; expectedRevision: number }): Promise<{ revision: number; entity: Record<string, unknown> }>;
  restoreOperatorConfig(domain: ConfigDomain, key: string, input: { entityType: ConfigEntityType; expectedRevision: number }): Promise<{ revision: number; entity: Record<string, unknown> }>;
  activityProposals(input?: { status?: ActivityProposalStatus; includeArchived?: boolean }): Promise<{ proposals: ApiActivityProposal[] }>;
  activityProposal(id: string): Promise<{ proposal: ApiActivityProposal }>;
  updateActivityProposal(id: string, input: { title?: string; categoryKey?: string; description?: string; status?: ActivityProposalStatus; reviewNote?: string }): Promise<{ proposal: ApiActivityProposal }>;
  archiveActivityProposal(id: string): Promise<void>;
  listComments(input: { contentType: CommentContentType; contentId: string; limit?: number; cursor?: string | null }): Promise<CommentPage>;
  createComment(input: { contentType: CommentContentType; contentId: string; body: string }): Promise<{ comment: ApiComment }>;
  deleteComment(commentId: string): Promise<void>;
}
