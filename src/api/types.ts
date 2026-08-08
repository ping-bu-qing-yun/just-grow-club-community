import type { Activity, CreateActivityInput, MessageThread, UserRole, UserSummary } from '../domain/types';

export type ContentType = 'activity' | 'need' | 'life';
export type ContentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
export interface ApiContentTag { id: string; contentType: ContentType; slug: string; label: string; enabled: boolean; }
export interface ApiUser extends UserSummary { phone: string; role: UserRole; }
export interface ApiActivity extends Activity { saved: boolean; joined: boolean; status?: ContentStatus; tags?: ApiContentTag[]; }
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
export interface QiahaoApi {
  login(phone: string, password: string): Promise<{ token: string; user: ApiUser }>;
  logout(): Promise<void>;
  me(): Promise<{ user: ApiUser }>;
  activities(): Promise<{ activities: ApiActivity[] }>;
  createActivity(input: CreateActivityInput): Promise<{ activity: ApiActivity }>;
  needs(): Promise<{ needs: ApiNeed[] }>;
  createNeed(body: string, tags?: string[]): Promise<{ need: ApiNeed }>;
  updateNeed(id: string, body: string, tags?: string[]): Promise<{ need: ApiNeed }>;
  archiveNeed(id: string): Promise<void>;
  lifePosts(): Promise<{ lifePosts: ApiLifePost[] }>;
  createLifePost(body: string, image?: string, tags?: string[]): Promise<{ lifePost: ApiLifePost }>;
  updateLifePost(id: string, body: string, image?: string, tags?: string[]): Promise<{ lifePost: ApiLifePost }>;
  archiveLifePost(id: string): Promise<void>;
  adminContent(filters?: { type?: ContentType; status?: ContentStatus; tag?: string }): Promise<{ items: AdminContentItem[] }>;
  updateContentStatus(id: string, status: Exclude<ContentStatus, 'draft'>, reason?: string): Promise<{ item: AdminContentItem }>;
  adminTags(type?: ContentType): Promise<{ tags: ApiContentTag[] }>;
  createTag(input: { type: ContentType; slug: string; label: string }): Promise<{ tag: ApiContentTag }>;
  updateTag(id: string, input: { slug?: string; label?: string; enabled?: boolean }): Promise<{ tag: ApiContentTag }>;
  favorite(id: string, saved: boolean): Promise<{ saved: boolean }>;
  join(id: string): Promise<{ thread: ApiThread }>;
  threads(): Promise<{ threads: ApiThread[] }>;
}
