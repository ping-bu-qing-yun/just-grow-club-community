import { X } from 'lucide-react';

/** 与产品稿一致的不考虑原因选项 */
export const DISLIKE_REASONS = [
  '想看看来的人',
  '怕太像相亲',
  '时间不合适',
  '地点有点远',
  '人数有顾虑',
  '话题没击中',
] as const;

export function DislikeReasonSheet({
  onSelect,
  onClose,
}: {
  onSelect: (reason: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="bottom-sheet feedback-reason-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="选择不考虑原因"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>你为什么不考虑？</h2>
        <p>你的选择会让推荐更准确</p>
        <div className="reason-grid">
          {DISLIKE_REASONS.map((reason) => (
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
