import { BadgeCheck, ChevronRight, Heart, LogOut, MessageSquareText, Settings, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { currentUser } from '../domain/seed';
import { useQiahao } from '../state/QiahaoContext';

export function ProfilePage({ onNotice }: { onNotice: (message: string) => void }) {
  const { activities, joinedIds, savedIds, user, logout } = useQiahao();
  const identity = user ?? currentUser;
  const hostedCount = activities.filter((activity) => activity.host.id === identity.id).length;

  const menu = [
    { label: `我发起的 · ${hostedCount}`, Icon: Sparkles },
    { label: `我参加的 · ${joinedIds.size}`, Icon: UsersRound },
    { label: `我的心愿 · ${savedIds.size}`, Icon: Heart },
    { label: '安全中心', Icon: ShieldCheck },
    { label: '设置', Icon: Settings },
    { label: '退出登录', Icon: LogOut },
  ];

  return (
    <main className="page profile-page">
      <div className="profile-cover" />
      <section className="profile-identity">
        <img src={identity.avatar} alt={identity.name} />
        <div><h1>{identity.name}</h1><p>{identity.bio}</p></div>
        <button type="button" className="icon-button" aria-label="编辑资料"><MessageSquareText size={19} /></button>
      </section>

      <div className="trust-strip">
        <span><BadgeCheck size={17} />已实名</span>
        <span><ShieldCheck size={17} />信用良好</span>
      </div>

      <section className="profile-stats" aria-label="活动统计">
        <div><strong>{joinedIds.size}</strong><span>参与 {joinedIds.size} 次</span></div>
        <div><strong>{hostedCount}</strong><span>发起活动</span></div>
        <div><strong>{savedIds.size}</strong><span>心愿收藏</span></div>
      </section>

      <section className="profile-menu" aria-label="个人功能">
        {menu.map(({ label, Icon }) => (
          <button key={label} type="button" onClick={() => label === '退出登录' ? void logout() : onNotice('该入口将在接入账号服务后开放')}>
            <span><Icon size={19} />{label}</span><ChevronRight size={18} />
          </button>
        ))}
      </section>
    </main>
  );
}

