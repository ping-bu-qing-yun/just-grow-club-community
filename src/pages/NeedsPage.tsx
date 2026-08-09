import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { lifePosts, seedNeeds } from '../club/seed';
import type { LifePost, Need } from '../club/types';
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
  const qiahao = useQiahaoOptional();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('view') === 'life' ? 'life' : 'needs';
  const filter = searchParams.get('filter') === 'similar' ? 'similar' : 'all';

  function updateView(nextMode: 'needs' | 'life') {
    const params = new URLSearchParams(searchParams);
    if (nextMode === 'life') params.set('view', 'life');
    else params.delete('view');
    if (nextMode === 'life') params.delete('filter');
    setSearchParams(params, { replace: true });
  }

  function updateFilter(nextFilter: 'all' | 'similar') {
    const params = new URLSearchParams(searchParams);
    if (nextFilter === 'similar') params.set('filter', 'similar');
    else params.delete('filter');
    setSearchParams(params, { replace: true });
  }
  const needs = useMemo(() => {
    const source = qiahao?.needs ?? seedNeeds;
    return [...new Map(source.map((item) => [item.id, item])).values()].filter((item) => filter !== 'similar' || item.similar);
  }, [filter, qiahao?.needs]);
  const lifeFeed = useMemo(() => {
    // Once the API provider exists, its approved response (or its explicit
    // read-only cache fallback) is authoritative. Seed data is only for the
    // standalone/offline preview that has no provider at all.
    const base = qiahao ? qiahao.lifePosts : lifePosts;
    return [...new Map(base.map((item) => [item.id, item])).values()];
  }, [qiahao]);

  return (
    <main className="needs-page page">
      <section className="needs-hero">
        <span>需求与生活</span>
        <h1>先说出你想遇见什么</h1>
        <p>也许刚好有人和你想的一样。点底部「+」发布需求或生活。</p>
      </section>

      <div className="needs-mode">
        <button type="button" className={mode === 'needs' ? 'is-active' : ''} onClick={() => updateView('needs')}>
          需求
        </button>
        <button type="button" className={mode === 'life' ? 'is-active' : ''} onClick={() => updateView('life')}>
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
              <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => updateFilter('all')}>
                全部需求
              </button>
              <button
                type="button"
                className={filter === 'similar' ? 'is-active' : ''}
                onClick={() => updateFilter('similar')}
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
          {qiahao?.hasMoreNeeds ? (
            <button className="secondary-button feed-load-more" type="button" disabled={qiahao.loadingMoreContent} onClick={() => void qiahao.loadMoreContent('need')}>
              {qiahao.loadingMoreContent ? '正在加载…' : '加载更多需求'}
            </button>
          ) : null}
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
          {qiahao?.hasMoreLifePosts ? (
            <button className="secondary-button feed-load-more" type="button" disabled={qiahao.loadingMoreContent} onClick={() => void qiahao.loadMoreContent('life')}>
              {qiahao.loadingMoreContent ? '正在加载…' : '加载更多生活'}
            </button>
          ) : null}
        </>
      )}
    </main>
  );
}
