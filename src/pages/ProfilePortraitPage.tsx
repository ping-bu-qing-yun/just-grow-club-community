import { useState } from 'react';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useClub } from '../club/ClubContext';
import { buildUserPortrait } from '../club/portrait';

type SupplementalInfoKey = 'ideal' | 'expectation' | 'age' | 'other';

export function ProfilePortraitPage({ onBack }: { onBack: () => void }) {
  const { state, saveBasicProfile } = useClub();
  const portrait = buildUserPortrait(state);
  const qaCount = Object.values(state.qaAnswers).filter((value) => value.trim()).length;
  const lightCount = state.lightAnswers.reduce((sum, answers) => sum + answers.length, 0);
  const [expandedInfo, setExpandedInfo] = useState('');
  const supplementalInfo = state.profile.supplementalInfo ?? {};
  const infoRows: Array<{
    key: SupplementalInfoKey;
    title: string;
    sub: string;
    placeholder: string;
  }> = [
    { key: 'ideal', title: '理想型描述', sub: '你理想中的TA是什么样的人', placeholder: '比如：情绪稳定、愿意沟通、周末喜欢一起散步。' },
    { key: 'expectation', title: '对恋爱的期待', sub: '你期待怎样的关系和相处方式', placeholder: '比如：慢慢了解，有边界，也能认真回应彼此。' },
    { key: 'age', title: '能接受的年龄范围', sub: '对方年龄区间', placeholder: '比如：26-34 岁，心理成熟比年龄更重要。' },
    { key: 'other', title: '其他你想告诉我们的', sub: '任何让你更立体的信息', placeholder: '比如：我不喜欢太赶的见面，希望第一次轻松一点。' },
  ];
  const updateSupplementalInfo = (key: SupplementalInfoKey, value: string) => {
    saveBasicProfile({
      ...state.profile,
      supplementalInfo: {
        ...supplementalInfo,
        [key]: value,
      },
    });
  };

  return (
    <main className="page standard-page profile-portrait-page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>我的画像</small><h1>关系画像</h1></div>
      </header>
      <section className="portrait-cover profile-portrait-cover">
        <img src={state.profile.avatar || '/assets/avatar-me.jpg'} alt={state.profile.nickname} />
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
      <section className="portrait-extra-info">
        <header>
          <h2>补充我的信息</h2>
          <p>更多信息让画像更准，推荐更合适</p>
        </header>
        <div>
          {infoRows.map((row) => (
            <article key={row.key}>
              <button type="button" onClick={() => setExpandedInfo((current) => current === row.key ? '' : row.key)}>
                <span><b>{row.title}</b><small>{row.sub}</small></span>
                <ChevronRight size={17} className={expandedInfo === row.key ? 'is-open' : ''} />
              </button>
              {expandedInfo === row.key ? (
                <label>
                  <span>{row.title}</span>
                  <textarea
                    placeholder={row.placeholder}
                    value={supplementalInfo[row.key] ?? ''}
                    onChange={(event) => updateSupplementalInfo(row.key, event.target.value)}
                  />
                </label>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
