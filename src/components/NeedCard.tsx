import { Bookmark, Heart, MessageCircle } from 'lucide-react';
import type { Need } from '../club/types';
import { useQiahao } from '../state/QiahaoContext';

export function NeedCard({
  need,
  onOpen,
}: {
  need: Need;
  onOpen: (need: Need, focusComments?: boolean) => void;
}) {
  const { toggleContentSaved, toggleContentResonance } = useQiahao();
  const saved = Boolean(need.saved);
  const resonated = Boolean(need.resonated);

  return (
    <article className="need-card-large">
      <button type="button" className="need-card-media" onClick={() => onOpen(need)}>
        <img src={need.image} alt="" />
        <span>{need.subtitle}</span>
      </button>
      <div className="need-card-content">
        <small>{need.author}</small>
        <button type="button" className="need-card-title" onClick={() => onOpen(need)}>
          <h3>{need.title}</h3>
        </button>
        <p>{need.copy}</p>
        <div className="club-tags">
          {need.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="need-card-actions">
          <button type="button" className={resonated ? 'is-active' : ''} onClick={() => toggleContentResonance('need', need.id)} aria-label={resonated ? '已共鸣' : '我也有'}>
            <Heart size={17} aria-hidden />
            {need.resonance + (resonated ? 1 : 0)}
          </button>
          <button type="button" onClick={() => onOpen(need, true)} aria-label={`查看${need.title}评论`}>
            <MessageCircle size={17} aria-hidden />
            {need.comments}
          </button>
          <button type="button" className={saved ? 'is-active' : ''} onClick={() => toggleContentSaved('need', need.id)} aria-label={saved ? '已收藏' : '收藏'}>
            <Bookmark size={17} aria-hidden />
            {saved ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </article>
  );
}
