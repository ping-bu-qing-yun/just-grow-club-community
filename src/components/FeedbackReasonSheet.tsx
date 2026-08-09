import { Sheet } from './Sheet';

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
    <Sheet label="选择不考虑原因" onClose={onClose} className="feedback-reason-sheet">
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
    </Sheet>
  );
}
