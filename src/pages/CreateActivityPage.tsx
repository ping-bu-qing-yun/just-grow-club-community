import { ArrowLeft, Coffee, Dices, Dumbbell, Footprints, ImagePlus, Minus, Palette, Plus, Utensils } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { Activity, ActivityCategory, CreateActivityInput } from '../domain/types';
import { useQiahao } from '../state/QiahaoContext';

type Draft = {
  title: string;
  category: ActivityCategory | null;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
};
type DraftErrors = Partial<Record<keyof Draft, string>>;

const initialDraft: Draft = {
  title: '',
  category: null,
  description: '',
  date: '',
  time: '',
  location: '',
  capacity: 4,
  price: 0,
};

const categoryOptions = [
  { label: '饭搭子' as const, Icon: Utensils },
  { label: '咖啡' as const, Icon: Coffee },
  { label: '运动' as const, Icon: Dumbbell },
  { label: '徒步' as const, Icon: Footprints },
  { label: '看展' as const, Icon: Palette },
  { label: '桌游' as const, Icon: Dices },
];

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;

/** 把 YYYY-MM-DD 转成展示用 dateLabel，如「周日 · 8月9日」。 */
export function formatActivityDateLabel(dateValue: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return dateValue.trim();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return dateValue.trim();
  }
  return `${weekdayLabels[date.getDay()]} · ${month}月${day}日`;
}

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function validateDraft(draft: Draft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.title.trim()) errors.title = '请填写活动标题';
  if (!draft.category) errors.category = '请选择活动类型';
  if (!draft.description.trim()) errors.description = '请简单介绍活动内容';
  if (!draft.date) errors.date = '请选择活动日期';
  if (!draft.time) errors.time = '请选择开始时间';
  if (!draft.location.trim()) errors.location = '请填写集合地点';
  return errors;
}

export function CreateActivityPage({ onBack, onCreated }: { onBack: () => void; onCreated: (activity: Activity) => void }) {
  const { createActivity } = useQiahao();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [posterImage, setPosterImage] = useState('');
  const minDate = useMemo(() => todayIsoDate(), []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const input: CreateActivityInput = {
      title: draft.title,
      category: draft.category as ActivityCategory,
      description: draft.description,
      dateLabel: formatActivityDateLabel(draft.date),
      time: draft.time,
      location: draft.location,
      capacity: draft.capacity,
      price: draft.price,
      image: posterImage,
    };
    try {
      const activity = await createActivity(input);
      onCreated(activity);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : '发布失败');
    }
  }

  return (
    <main className="page standard-page create-page">
      <header className="subpage-header create-page__header">
        <button type="button" aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <span className="eyebrow">CREATE</span>
          <h1>发起一次恰好的见面</h1>
          <p>信息越清楚，越容易遇到同频的人。</p>
        </div>
      </header>
      <form className="create-form" onSubmit={submit} noValidate>
        <section className="activity-template-card">
          <label className={`poster-upload ${posterImage ? 'has-image' : ''}`}>
            {posterImage ? <img src={posterImage} alt="" /> : <span><ImagePlus size={24} />添加优质图片更吸引人</span>}
            <input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPosterImage(URL.createObjectURL(file));
            }} />
          </label>
          <input
            aria-label="活动标题"
            className="activity-title-input"
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="填写清晰的活动标题（必填 20 字内）"
            maxLength={20}
          />
          <textarea
            aria-label="活动介绍"
            className="activity-desc-input"
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="描述一下活动的亮点、活动内容、推荐的人群、贴心 tips 等，叫大家一起粗门玩吧～"
            rows={5}
          />
        </section>
        {errors.title && <small className="field-error">{errors.title}</small>}
        {errors.description && <small className="field-error">{errors.description}</small>}

        <fieldset className="form-section activity-template-section">
          <legend>单次活动</legend>
          <div className="template-field-row">
            <b>*活动分类</b>
            <div className="activity-category-pills">
              {categoryOptions.map(({ label, Icon }) => (
                <button key={label} type="button" className={draft.category === label ? 'is-active' : ''} onClick={() => update('category', label)}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </fieldset>

        <div className="form-row">
          <label className="form-field">
            <span>日期</span>
            <input
              type="date"
              aria-label="日期"
              value={draft.date}
              min={minDate}
              onChange={(event) => update('date', event.target.value)}
            />
            {draft.date && !errors.date && (
              <small className="field-help field-help--left">{formatActivityDateLabel(draft.date)}</small>
            )}
            {errors.date && <small className="field-error">{errors.date}</small>}
          </label>
          <label className="form-field">
            <span>时间</span>
            <input
              type="time"
              aria-label="时间"
              value={draft.time}
              step={300}
              onChange={(event) => update('time', event.target.value)}
            />
            {errors.time && <small className="field-error">{errors.time}</small>}
          </label>
        </div>

        <label className="form-field">
          <span>集合地点</span>
          <input
            aria-label="集合地点"
            value={draft.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder="输入具体、好找的公共场所"
          />
          {errors.location && <small className="field-error">{errors.location}</small>}
        </label>

        <div className="form-row form-row--controls">
          <div className="form-control-block">
            <span>总人数</span>
            <div className="stepper">
              <button type="button" aria-label="减少人数" onClick={() => update('capacity', Math.max(2, draft.capacity - 1))}>
                <Minus size={17} />
              </button>
              <strong>{draft.capacity}</strong>
              <button type="button" aria-label="增加人数" onClick={() => update('capacity', Math.min(20, draft.capacity + 1))}>
                <Plus size={17} />
              </button>
            </div>
          </div>
          <label className="form-field form-field--price">
            <span>费用 / 人</span>
            <div className="price-input">
              <b>¥</b>
              <input
                type="number"
                min="0"
                max="999"
                value={draft.price}
                onChange={(event) => update('price', Math.max(0, Number(event.target.value)))}
                aria-label="费用"
              />
            </div>
          </label>
        </div>

        <div className="publish-note">发布即代表你愿意遵守恰好社区公约，并对活动信息的真实性负责。</div>
        {submitError && <p className="field-error" role="alert">{submitError}</p>}
        <button type="submit" className="primary-button primary-button--wide publish-button">
          确认发布
        </button>
      </form>
    </main>
  );
}
