import { useState } from 'react';
import { ArrowLeft, ImagePlus, Mic } from 'lucide-react';
import { useQiahao } from '../state/QiahaoContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../data/queryClient';

const previewTags = [
  ['natural-chat', '自然聊天'], ['small-group', '少人数'], ['weekend', '周末'], ['nearby', '附近'], ['deep-talk', 'deep talk'],
].map(([slug, label]) => ({ id: slug, contentType: 'need' as const, slug, label, enabled: true }));

export function CreateNeedPage({ onBack, onPublished }: { onBack: () => void; onPublished: () => void }) {
  const { createNeed, localMode } = useQiahao();
  const tagQuery = useQuery({ queryKey: [...queryKeys.config, 'content-tags', 'need'], queryFn: () => api.tags('need'), enabled: !localMode });
  const tagOptions = tagQuery.data?.tags ?? (localMode ? previewTags : []);
  const guides = tagOptions.slice(0, 4).map((tag) => `想认识也在意「${tag.label}」的人。`);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!text.trim()) {
      setError('先写下一句话');
      return;
    }
    setPending(true);
    setError('');
    try {
      await createNeed(text.trim(), tags);
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
      <p className="create-need-lead">不用写得很正式，像给朋友发一句消息就好。</p>
      <div className="guide-chips">{guides.map((guide) => <button type="button" onClick={() => setText(guide)} key={guide}>{guide}</button>)}</div>
      <textarea aria-label="需求内容" value={text} onChange={(event) => { setText(event.target.value); setError(''); }} placeholder="比如：最近想找能慢慢聊天的人……" />
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="need-tools"><button type="button" onClick={() => setText(text || '我想先轻松认识，不急着定义关系。')}><Mic size={18} />语音说一段</button><button type="button"><ImagePlus size={18} />加图片</button></div>
      <div className="tag-picks">{tagOptions.map((tag) => <button type="button" className={tags.includes(tag.slug) ? 'is-active' : ''} onClick={() => setTags((current) => current.includes(tag.slug) ? current.filter((item) => item !== tag.slug) : [...current, tag.slug])} key={tag.id}>#{tag.label}</button>)}</div>
      <button type="button" className="primary-button primary-button--wide" onClick={() => void submit()} disabled={pending}>{pending ? '发布中…' : '确认发布'}</button>
    </main>
  );
}
