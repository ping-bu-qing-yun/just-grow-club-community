import { Sheet } from './Sheet';

export function DislikeReasonSheet({
  options,
  onSelect,
  onClose,
}: {
  options: Array<{ key: string; label: string }>;
  onSelect: (key: string, label: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet label="选择不考虑原因" onClose={onClose} className="feedback-reason-sheet">
        <h2>你为什么不考虑？</h2>
        <p>你的选择会让推荐更准确</p>
        <div className="reason-grid">
          {options.map((reason) => (
            <button
              key={reason.key}
              type="button"
              className="reason-option"
              onClick={() => onSelect(reason.key, reason.label)}
            >
              {reason.label}
            </button>
          ))}
        </div>
    </Sheet>
  );
}
