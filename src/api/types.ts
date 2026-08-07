import type { Activity, CreateActivityInput, MessageThread, UserSummary } from '../domain/types';
export interface ApiUser extends UserSummary { phone: string; }
export interface ApiActivity extends Activity { saved: boolean; joined: boolean; }
export interface ApiThread extends MessageThread { }
export interface QiahaoApi {
  login(phone: string, password: string): Promise<{ token: string; user: ApiUser }>;
  logout(): Promise<void>;
  me(): Promise<{ user: ApiUser }>;
  activities(): Promise<{ activities: ApiActivity[] }>;
  createActivity(input: CreateActivityInput): Promise<{ activity: ApiActivity }>;
  favorite(id: string, saved: boolean): Promise<{ saved: boolean }>;
  join(id: string): Promise<{ thread: ApiThread }>;
  threads(): Promise<{ threads: ApiThread[] }>;
}
