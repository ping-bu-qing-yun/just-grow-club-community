import { ArrowRight, Bell, Sparkles } from 'lucide-react';
import { clubActivities, seedNeeds } from '../club/seed';
import { useClub } from '../club/ClubContext';
import { ClubActivityCard } from '../components/ClubActivityCard';

export function ActivitiesHomePage({
  onExplore,
  onNeeds,
}: {
  onExplore: () => void;
  onNeeds: () => void;
}) {
  const { state } = useClub();

  return (
    <main className="club-home page">
      <header className="club-home-header">
        <div>
          <small>周末好，{state.profile.nickname}</small>
          <h1>恰好</h1>
        </div>
        <button className="icon-button" aria-label="通知">
          <Bell size={20} />
        </button>
      </header>

      <section className="portrait-strip">
        <div className="portrait-strip-head">
          <span>
            <Sparkles size={15} />
            刚刚懂你一点
          </span>
          <b>42%</b>
        </div>
        <h2>你更适合，慢一点认识的场景</h2>
        <p>先看清自己的社交需求，再挑一场舒服的见面。</p>
        <div>
          <span>怕尴尬</span>
          <span>少人数</span>
          <span>自然聊天</span>
        </div>
      </section>

      <section className="club-feature">
        <img src={clubActivities[0].image} alt="周五轻聊天晚餐局" />
        <div>
          <small>本周精选 · 成熟活动</small>
          <h2>周五轻聊天晚餐局</h2>
          <p>6-8人 · KIC附近 · 周五19:30</p>
        </div>
      </section>

      <section className="club-section">
        <header>
          <div>
            <span>FOR YOU</span>
            <h2>给你的见面</h2>
          </div>
          <button onClick={onExplore}>
            查看全部
            <ArrowRight size={15} />
          </button>
        </header>
        <div className="club-card-list">
          {clubActivities.slice(1, 4).map((activity) => (
            <ClubActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </section>

      <section className="need-recommend" onClick={onNeeds}>
        <img src={seedNeeds[0].image} alt="" />
        <div>
          <small>需求广场 · 72人共鸣</small>
          <h2>不想尴尬交换微信，但想认真认识人</h2>
          <p>如果暂时没有合适活动，可以先看见同频的人。</p>
          <button>
            去看看
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </main>
  );
}
