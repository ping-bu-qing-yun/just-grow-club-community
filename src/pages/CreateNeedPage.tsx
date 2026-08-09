import { useState } from 'react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useQiahao } from '../state/QiahaoContext';

const guides = [
  {
    text: '想认识能自然聊天、不用硬找话题的人。',
    tags: ['natural-chat', 'small-group'],
  },
  {
    text: '周末想找附近的人，一起散步或喝杯咖啡。',
    tags: ['weekend', 'nearby'],
  },
  {
    text: '不想一上来就交换微信，先舒服地认识。',
    tags: ['natural-chat', 'small-group'],
  },
  {
    text: '想找能认真聊价值观、不止聊工作的人。',
    tags: ['deep-talk', 'natural-chat'],
  },
];
const tagOptions = [
  { value: '自然聊天', ref: 'natural-chat' },
  { value: '少人数', ref: 'small-group' },
  { value: '周末', ref: 'weekend' },
  { value: '附近', ref: 'nearby' },
  { value: 'deep talk', ref: 'deep-talk' },
];
const coverOptions = [
  { label: '咖啡', image: '/assets/coffee.jpg' },
  { label: '散步', image: '/assets/hike.jpg' },
  { label: '看展', image: '/assets/art.jpg' },
];

export function CreateNeedPage({ onBack, onPublished }: { onBack: () => void; onPublished: () => void }) {
  const { createNeed } = useQiahao();
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploadedCover, setUploadedCover] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  function applyGuide(guide: (typeof guides)[number]) {
    setText(guide.text);
    setError('');
  }

  async function submit() {
    if (!tags.length) {
      setError('请至少选择一个标签');
      return;
    }
    if (!text.trim()) {
      setError('先写下一句话');
      return;
    }
    setPending(true);
    setError('');
    try {
      await createNeed(text.trim(), tags, uploadedCover || coverOptions[coverIndex].image);
      onPublished();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '发布失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="create-need page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>发布需求</small><h1>写下你想遇见什么</h1></div>
      </header>
      <div className="guide-chips guide-chips--compact">{guides.map((guide) => <button type="button" onClick={() => applyGuide(guide)} key={guide.text}>{guide.text}</button>)}</div>
      <textarea aria-label="需求内容" value={text} onChange={(event) => { setText(event.target.value); setError(''); }} placeholder="比如：最近想找能慢慢聊天的人……" />
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="publish-cover-picker" aria-label="需求封面预览">
        <img src={uploadedCover || coverOptions[coverIndex].image} alt="" />
        <div>
          <b>展示封面</b>
          <span>{coverOptions[coverIndex].label}场景 · 发布后用于需求卡片氛围图</span>
        </div>
      </div>
      <div className="need-tools">
        <label><ImagePlus size={18} />上传封面<input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setUploadedCover(URL.createObjectURL(file));
        }} /></label>
        <button type="button" onClick={() => { setUploadedCover(''); setCoverIndex((index) => (index + 1) % coverOptions.length); }}><ImagePlus size={18} />换推荐图</button>
      </div>
      <small className="publish-helper">请选择至少一个标签，方便系统推荐给同频的人。</small>
      <div className="tag-picks">{tagOptions.map((tag) => <button type="button" className={tags.includes(tag.ref) ? 'is-active' : ''} onClick={() => setTags((current) => current.includes(tag.ref) ? current.filter((item) => item !== tag.ref) : [...current, tag.ref])} key={tag.ref}>#{tag.value}</button>)}</div>
      <button type="button" className="primary-button primary-button--wide" onClick={() => void submit()} disabled={pending}>{pending ? '发布中…' : '确认发布'}</button>
    </main>
  );
}
