import { useMemo, useState } from 'react';
import { lifePosts, seedNeeds } from '../club/seed';
import type { LifePost, Need } from '../club/types';
import { useClub } from '../club/ClubContext';
import { useQiahaoOptional } from '../state/QiahaoContext';
import { NeedCard } from '../components/NeedCard';
import { LifePostCard } from '../components/LifePostCard';

export function NeedsPage({
  onOpenNeed,
  onOpenLifePost,
}: {
  onOpenNeed: (need: Need, focusComments?: boolean) => void;
  onOpenLifePost?: (post: LifePost, focusComments?: boolean) => void;
}) {
  const { state } = useClub();
  const qiahao = useQiahaoOptional();
  const [mode, setMode] = useState<'needs' | 'life'>('needs');
  const [filter, setFilter] = useState('all');
  const needs = useMemo(() => {
    const source = qiahao?.needs ?? [...state.publishedNeeds, ...seedNeeds];
    return [...new Map(source.map((item) => [item.id, item])).values()].filter((item) => filter !== 'similar' || item.similar);
  }, [filter, qiahao?.needs, state.publishedNeeds]);
  const lifeFeed = useMemo(() => {
    // Once the API provider exists, its approved response (or its explicit
    // read-only cache fallback) is authoritative. Seed data is only for the
    // standalone/offline preview that has no provider at all.
    const base = qiahao ? qiahao.lifePosts : [...(state.publishedLifePosts ?? []), ...lifePosts];
    return [...new Map(base.map((item) => [item.id, item])).values()];
  }, [qiahao, state.publishedLifePosts]);

  return (
    <main className="needs-page page">
      <section className="needs-hero">
        <span>需求与生活</span>
        <h1>先说出你想遇见什么</h1>
        <p>也许刚好有人和你想的一样。点底部「+」发布需求或生活。</p>
      </section>

      <div className="needs-mode">
        <button type="button" className={mode === 'needs' ? 'is-active' : ''} onClick={() => setMode('needs')}>
          需求
        </button>
        <button type="button" className={mode === 'life' ? 'is-active' : ''} onClick={() => setMode('life')}>
          生活
        </button>
      </div>

      {mode === 'needs' ? (
        <>
          <header className="needs-subhead">
            <div>
              <h2>大家正在寻找</h2>
              <p>看看谁和你想的一样</p>
            </div>
            <div>
              <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
                全部需求
              </button>
              <button
                type="button"
                className={filter === 'similar' ? 'is-active' : ''}
                onClick={() => setFilter('similar')}
              >
                和你相似
              </button>
            </div>
          </header>
          <div className="needs-list">
            {needs.map((need) => (
              <NeedCard need={need} onOpen={onOpenNeed} key={need.id} />
            ))}
          </div>
        </>
      ) : (
        <>
          <header className="needs-subhead">
            <div>
              <h2>生活动态</h2>
              <p>先看见彼此</p>
            </div>
          </header>
          <div className="life-feed">
            {lifeFeed.map((post) => (
              <LifePostCard post={post} key={post.id} onOpen={onOpenLifePost} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
