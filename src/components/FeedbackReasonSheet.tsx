import { X } from 'lucide-react';

export const CONSIDER_REASONS = [
  '想看看来的人',
  '怕太像相亲',
  '时间不合适',
  '地点有点远',
  '人数有顾虑',
  '话题没击中',
] as const;

export const DISLIKE_REASONS = [
  '想看看来的人',
  '怕太像相亲',
  '时间不合适',
  '地点有点远',
  '人数有顾虑',
  '话题没击中',
] as const;

export type FeedbackReasonKind = 'consider' | 'dislike';

export function FeedbackReasonSheet({
  kind,
  onSelect,
  onClose,
}: {
  kind: FeedbackReasonKind;
  onSelect: (reason: string) => void;
  onClose: () => void;
}) {
  const isConsider = kind === 'consider';
  const reasons = isConsider ? CONSIDER_REASONS : DISLIKE_REASONS;

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="bottom-sheet feedback-reason-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={isConsider ? '选择考虑原因' : '选择不考虑原因'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>{isConsider ? '你为什么还想考虑？' : '你为什么不考虑？'}</h2>
        <p>你的选择会让推荐更准确</p>
        <div className="reason-grid">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              className="reason-option"
              onClick={() => onSelect(reason)}
            >
              {reason}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
