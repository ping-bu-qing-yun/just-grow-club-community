import { Coffee, Dices, Dumbbell, Footprints, Minus, Palette, Plus, Utensils } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Activity, ActivityCategory, CreateActivityInput } from '../domain/types';
import { useQiahao } from '../state/QiahaoContext';

type Draft = Omit<CreateActivityInput, 'category'> & { category: ActivityCategory | null };
type DraftErrors = Partial<Record<keyof Draft, string>>;

const initialDraft: Draft = {
  title: '', category: null, description: '', dateLabel: '', time: '', location: '', capacity: 4, price: 0,
};

const categoryOptions = [
  { label: '饭搭子' as const, Icon: Utensils },
  { label: '咖啡' as const, Icon: Coffee },
  { label: '运动' as const, Icon: Dumbbell },
  { label: '徒步' as const, Icon: Footprints },
  { label: '看展' as const, Icon: Palette },
  { label: '桌游' as const, Icon: Dices },
];

function validateDraft(draft: Draft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.title.trim()) errors.title = '请填写活动标题';
  if (!draft.category) errors.category = '请选择活动类型';
  if (!draft.description.trim()) errors.description = '请简单介绍活动内容';
  if (!draft.dateLabel.trim()) errors.dateLabel = '请填写活动日期';
  if (!draft.time.trim()) errors.time = '请填写开始时间';
  if (!draft.location.trim()) errors.location = '请填写集合地点';
  return errors;
}

export function CreateActivityPage({ onCreated }: { onCreated: (activity: Activity) => void }) {
  const { createActivity } = useQiahao();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [errors, setErrors] = useState<DraftErrors>({});

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const activity = createActivity(draft as CreateActivityInput);
    onCreated(activity);
  }

  return (
    <main className="page standard-page create-page">
      <header className="page-header"><span className="eyebrow">CREATE</span><h1>发起一次恰好的见面</h1><p>信息越清楚，越容易遇到同频的人。</p></header>
      <form className="create-form" onSubmit={submit} noValidate>
        <fieldset className="form-section">
          <legend>想找什么搭子？</legend>
          <div className="category-grid">
            {categoryOptions.map(({ label, Icon }) => (
              <button key={label} type="button" className={draft.category === label ? 'is-active' : ''} onClick={() => update('category', label)}>
                <Icon size={20} /><span>{label}</span>
              </button>
            ))}
          </div>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </fieldset>

        <label className="form-field">
          <span>活动标题</span>
          <input aria-label="活动标题" value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="例如：周日城市散步" aria-describedby={errors.title ? 'title-error' : undefined} />
          {errors.title && <small className="field-error" id="title-error">{errors.title}</small>}
        </label>

        <label className="form-field">
          <span>活动介绍</span>
          <textarea aria-label="活动介绍" value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="路线、节奏、适合什么样的人……" rows={4} />
          <small className={errors.description ? 'field-error' : 'field-help'}>{errors.description ?? `${draft.description.length}/160`}</small>
        </label>

        <div className="form-row">
          <label className="form-field"><span>日期</span><input aria-label="日期" value={draft.dateLabel} onChange={(event) => update('dateLabel', event.target.value)} placeholder="周日 · 8月9日" />{errors.dateLabel && <small className="field-error">{errors.dateLabel}</small>}</label>
          <label className="form-field"><span>时间</span><input aria-label="时间" value={draft.time} onChange={(event) => update('time', event.target.value)} placeholder="16:00" />{errors.time && <small className="field-error">{errors.time}</small>}</label>
        </div>

        <label className="form-field"><span>集合地点</span><input aria-label="集合地点" value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="输入具体、好找的公共场所" />{errors.location && <small className="field-error">{errors.location}</small>}</label>

        <div className="form-row form-row--controls">
          <div className="form-control-block"><span>总人数</span><div className="stepper"><button type="button" aria-label="减少人数" onClick={() => update('capacity', Math.max(2, draft.capacity - 1))}><Minus size={17} /></button><strong>{draft.capacity}</strong><button type="button" aria-label="增加人数" onClick={() => update('capacity', Math.min(20, draft.capacity + 1))}><Plus size={17} /></button></div></div>
          <label className="form-field form-field--price"><span>费用 / 人</span><div className="price-input"><b>¥</b><input type="number" min="0" max="999" value={draft.price} onChange={(event) => update('price', Math.max(0, Number(event.target.value)))} aria-label="费用" /></div></label>
        </div>

        <div className="publish-note">发布即代表你愿意遵守恰好社区公约，并对活动信息的真实性负责。</div>
        <button type="submit" className="primary-button primary-button--wide publish-button">确认发布</button>
      </form>
    </main>
  );
}
