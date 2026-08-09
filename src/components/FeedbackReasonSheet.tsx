import { X } from 'lucide-react';

/** 不喜欢用于排除推荐；考虑用于识别转化阻力；取消用于活动履约改进。 */
export const DISLIKE_REASONS = [
  '不是我想认识的人',
  '怕太像相亲',
  '主题没有吸引我',
  '人太多或太吵',
  '形式不够自然',
  '不想再看到类似活动',
] as const;

export const CONSIDER_REASONS = [
  '想先看看来的人',
  '想知道现场流程',
  '想确认男女比例',
  '想等朋友一起去',
  '地点可以但还在犹豫',
  '价格/时间需要再确认',
] as const;

export const CANCEL_REASONS = [
  '临时有事去不了',
  '时间安排冲突',
  '地点不方便',
  '朋友不去了',
  '费用/预算原因',
  '对活动内容还有顾虑',
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
        aria-label="选择不喜欢原因"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>你为什么不喜欢？</h2>
        <p>你的选择会让推荐更准确</p>
        <div className="reason-grid reason-grid--chips">
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

export function CancelReasonSheet({
  actionLabel,
  onSelect,
  onClose,
}: {
  actionLabel: string;
  onSelect: (reason: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="bottom-sheet feedback-reason-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`选择${actionLabel}原因`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>为什么要{actionLabel}？</h2>
        <p>小CC 会用它优化活动安排和提醒</p>
        <div className="reason-grid reason-grid--chips">
          {CANCEL_REASONS.map((reason) => (
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
