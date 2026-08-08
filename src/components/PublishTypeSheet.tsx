import { CalendarHeart, MessagesSquare, Sparkles, X } from 'lucide-react';

export type PublishKind = 'activity' | 'need' | 'life';

export function PublishTypeSheet({
  canPublishActivity,
  onSelect,
  onClose,
}: {
  canPublishActivity: boolean;
  onSelect: (kind: PublishKind) => void;
  onClose: () => void;
}) {
  const options = [
    canPublishActivity
      ? {
          id: 'activity' as const,
          label: '活动',
          description: '发起一场可报名的线下见面',
          Icon: CalendarHeart,
        }
      : null,
    {
      id: 'need' as const,
      label: '需求',
      description: '直接说出你想遇见什么',
      Icon: MessagesSquare,
    },
    {
      id: 'life' as const,
      label: '生活',
      description: '分享日常，让人先看见彼此',
      Icon: Sparkles,
    },
  ].filter(Boolean) as Array<{
    id: PublishKind;
    label: string;
    description: string;
    Icon: typeof CalendarHeart;
  }>;

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="bottom-sheet publish-type-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="选择发布类型"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>想发布什么？</h2>
        <p>{canPublishActivity ? '管理者可发布活动、需求与生活' : '你可以发布需求或生活动态'}</p>
        <div className="publish-type-list">
          {options.map(({ id, label, description, Icon }) => (
            <button
              key={id}
              type="button"
              className="publish-type-option"
              onClick={() => onSelect(id)}
            >
              <span className={`publish-type-option__icon publish-type-option__icon--${id}`}>
                <Icon size={20} />
              </span>
              <span className="publish-type-option__copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
