import { ArrowRight, Sparkles } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { computePortraitCompleteness } from '../../club/portrait';

export function PortraitStep({ onComplete }: { onComplete: () => void }) {
  const { state, completeOnboarding } = useClub();
  const completeness = computePortraitCompleteness(state);
  const nickname = state.profile.nickname || '小恰';

  return (
    <section className="onboarding-body portrait-step">
      <div className="portrait-cover profile-portrait-cover onboarding-portrait-cover">
        <img src={state.profile.avatar || '/assets/avatar-me.jpg'} alt={nickname} />
        <span><Sparkles size={16} />初回画像</span>
        <h1>低压力线下重启型</h1>
        <p>{nickname} · 画像完成度 {completeness}%</p>
      </div>
      <div className="portrait-tags">
        <span>想认识靠谱的人</span>
        <span className="orange">怕太像相亲</span>
        <span>适合少人数</span>
        <span className="orange">需要自然话题</span>
      </div>
      <blockquote>你不是不想认识人，只是想在舒服一点的地方开始。</blockquote>
      <div className="portrait-compare">
        <div><b>适合先试试</b><p>6-8人饭局<br />散步局<br />有主持人的 deep talk</p></div>
        <div className="avoid"><b>先少推荐</b><p>大型破冰<br />8分钟轮转<br />强目的相亲局</p></div>
      </div>
      <button
        type="button"
        className="primary-button primary-button--wide"
        onClick={() => {
          completeOnboarding();
          onComplete();
        }}
      >
        去看你的专属<ArrowRight size={18} />
      </button>
    </section>
  );
}
