import { BadgeCheck, Bookmark, ChevronRight, CircleHelp, Heart, LogOut, MessageCircle, PenLine, Settings, ShieldCheck, Sparkles, UsersRound, Shield } from 'lucide-react';
import { useClub } from '../club/ClubContext';
import { useQiahao } from '../state/QiahaoContext';

export type ProfileDestination = 'editor' | 'messages' | 'saved-activities' | 'saved-needs' | 'dynamics' | 'portrait' | 'attended' | 'admin-content' | 'help' | 'safety' | 'settings';

export function ProfilePage({ onNotice, onNavigate }: { onNotice: (message: string) => void; onNavigate?: (destination: ProfileDestination) => void }) {
  const { state, resetOnboarding } = useClub();
  const { activities, joinedIds, savedIds, user, needs, logout } = useQiahao();
  const identity = user ?? { id: 'me', name: state.profile.nickname, avatar: '/assets/avatar-me.jpg', bio: state.profile.bio, role: 'member' as const };
  const hosted = activities.filter((item) => item.host.id === identity.id).length;
  const joinedCount = joinedIds.size + state.joinedClubActivityIds.length;
  const savedActivityCount = savedIds.size + state.savedClubActivityIds.length;
  const rows = [
    { label: '参加过活动', sub: `已报名 ${joinedCount} 场`, Icon: UsersRound, d: 'attended' as const },
    { label: '活动收藏', sub: `已收藏 ${savedActivityCount} 场活动`, Icon: Heart, d: 'saved-activities' as const },
    { label: '需求收藏', sub: `已收藏 ${state.savedNeedIds.length} 张需求卡`, Icon: Bookmark, d: 'saved-needs' as const },
    { label: '我的动态', sub: '发布动态和过去的生活记录', Icon: PenLine, d: 'dynamics' as const },
    { label: '我的画像', sub: '根据回答和活动反馈持续更新', Icon: Sparkles, d: 'portrait' as const },
  ];
  return (
    <main className="page club-profile">
      <div className="profile-cover" />
      <section className="profile-identity"><img src={identity.avatar} alt={identity.name} /><div><h1>{state.profile.nickname || identity.name}</h1><p>低压力线下重启型</p></div><button className="icon-button" aria-label="编辑资料" onClick={() => onNavigate?.('editor')}><PenLine size={18} /></button></section>
      <div className="trust-strip"><span><BadgeCheck size={17} />已实名</span><span><ShieldCheck size={17} />信用良好</span></div>
      <section className="portrait-progress"><div><b>画像完善度</b><span>42%</span></div><i><em /></i><p>每次回答和活动反馈，都会让推荐更贴合你。</p></section>
      <section className="profile-promos"><button onClick={() => { resetOnboarding(); onNavigate?.('portrait'); }}><Sparkles /><b>画像成长</b><span>继续认识自己</span></button><button className="orange" onClick={() => onNavigate?.('saved-needs')}><Bookmark /><b>需求收藏</b><span>查看收藏的需求</span></button></section>
      <section className="profile-stats" aria-label="活动统计"><div><strong>{joinedCount}</strong><span>参与活动</span></div><div><strong>{hosted}</strong><span>发起活动</span></div><div><strong>{needs.length}</strong><span>公开需求</span></div></section>
      <section className="club-profile-section"><h2>我的记录</h2>{rows.map(({ label, sub, Icon, d }) => <button key={label} onClick={() => onNavigate?.(d)}><span className="profile-row-icon"><Icon size={18} /></span><span><b>{label}</b><small>{sub}</small></span><ChevronRight size={17} /></button>)}</section>
      {user?.role === 'operator' && <section className="club-profile-section"><h2>运营工作台</h2><button onClick={() => onNavigate?.('admin-content')}><span className="profile-row-icon"><Shield size={18} /></span><span><b>管理动作</b><small>AI提案、每日分身、经营明细与活动管理</small></span><ChevronRight size={17} /></button></section>}
      <section className="club-profile-section"><button onClick={() => onNavigate?.('messages')}><span className="profile-row-icon"><MessageCircle size={18} /></span><span><b>我的消息</b><small>报名、缴费、互动与系统通知</small></span><ChevronRight size={17} /></button></section>
      <section className="club-profile-section"><h2>更多服务</h2><button onClick={() => onNavigate?.('help')}><span className="profile-row-icon"><CircleHelp size={18} /></span><span><b>帮助与客服</b><small>遇到问题可以找小CC</small></span><ChevronRight size={17} /></button><button onClick={() => onNavigate?.('safety')}><span className="profile-row-icon"><ShieldCheck size={18} /></span><span><b>安全中心</b><small>隐私、举报与活动边界</small></span><ChevronRight size={17} /></button><button onClick={() => onNavigate?.('settings')}><span className="profile-row-icon"><Settings size={18} /></span><span><b>设置</b><small>通知、授权与账号</small></span><ChevronRight size={17} /></button><button className="danger" onClick={() => void logout()}><span className="profile-row-icon"><LogOut size={18} /></span><span><b>退出当前账号</b><small>退出后回到登录页</small></span><ChevronRight size={17} /></button></section>
      <p className="profile-id">恰好号：78135154</p>
    </main>
  );
}
