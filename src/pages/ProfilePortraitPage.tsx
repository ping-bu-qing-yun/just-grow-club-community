import { ArrowLeft, Sparkles } from 'lucide-react';
import { useClub } from '../club/ClubContext';
import { buildUserPortrait } from '../club/portrait';

export function ProfilePortraitPage({ onBack }: { onBack: () => void }) {
  const { state } = useClub();
  const portrait = buildUserPortrait(state);
  const qaCount = Object.values(state.qaAnswers).filter((value) => value.trim()).length;
  const lightCount = state.lightAnswers.reduce((sum, answers) => sum + answers.length, 0);

  return (
    <main className="page standard-page profile-portrait-page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>我的画像</small><h1>关系画像</h1></div>
      </header>
      <section className="portrait-cover profile-portrait-cover">
        <img src="/assets/avatar-me.jpg" alt={state.profile.nickname} />
        <span><Sparkles size={16} />持续更新中</span>
        <h1>{portrait.summaryLabel}</h1>
        <p>{state.profile.nickname} · 画像完成度 {portrait.completeness}%</p>
      </section>
      <section className="portrait-progress profile-portrait-progress">
        <div><b>画像完善度</b><span>{portrait.completeness}%</span></div>
        <i><em style={{ width: `${portrait.completeness}%` }} /></i>
        <p>来自 {lightCount} 个轻问答选择、{qaCount} 个画像回答，以及基础资料。</p>
      </section>
      <section className="operator-panel">
        <header><h2>当前标签</h2><span>{portrait.highlightTags.length} 个</span></header>
        <div className="club-tags">{portrait.highlightTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </section>
      <section className="operator-panel">
        <header><h2>适合先试试</h2></header>
        <div className="portrait-compare">
          <div><b>推荐</b><p>{[...portrait.scenes, ...portrait.preferences].slice(0, 4).join(' / ') || '少人数活动 / 散步局 / 有主持人的轻社交'}</p></div>
          <div className="avoid"><b>先少推荐</b><p>{portrait.barriers.slice(0, 4).join(' / ') || '强目的相亲 / 大型破冰 / 节奏过快的局'}</p></div>
        </div>
      </section>
      <button type="button" className="secondary-button records-return-button" onClick={onBack}>返回我的</button>
    </main>
  );
}
