import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useQiahao } from '../state/QiahaoContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../data/queryClient';

const previewTags = [['daily', '生活记录'], ['weekend', '周末'], ['nearby', '附近']]
  .map(([slug, label]) => ({ id: slug, contentType: 'life' as const, slug, label, enabled: true }));

export function CreateLifePage({ onBack, onPublished }: { onBack: () => void; onPublished: () => void }) {
  const { createLifePost, localMode } = useQiahao();
  const tagQuery = useQuery({ queryKey: [...queryKeys.config, 'content-tags', 'life'], queryFn: () => api.tags('life'), enabled: !localMode });
  const tagOptions = tagQuery.data?.tags ?? (localMode ? previewTags : []);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
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
      await createLifePost(text.trim(), image.trim() || undefined, tags);
      onPublished();
    } catch (reason) {
      // 本地预览写入内存状态后即视为成功。
      if (localMode) {
        onPublished();
      } else {
        setError(reason instanceof Error ? reason.message : '发布失败');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="create-need page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>发布生活</small><h1>分享此刻的日常</h1></div>
      </header>
      <p className="create-need-lead">不用很正式，像给朋友发一条近况就好。</p>
      <textarea aria-label="生活内容" value={text} onChange={(event) => { setText(event.target.value); setError(''); }} placeholder="比如：周末想找人一起去梧桐区散步……" />
      <label className="form-field"><span>图片地址（可选）</span><input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://… 或 /assets/…" /><small className="field-help">仅支持 HTTPS 或同源 /assets/ 路径</small></label>
      <div className="tag-picks">{tagOptions.map((tag) => <button type="button" className={tags.includes(tag.slug) ? 'is-active' : ''} onClick={() => setTags((current) => current.includes(tag.slug) ? current.filter((item) => item !== tag.slug) : [...current, tag.slug])} key={tag.id}>#{tag.label}</button>)}</div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="button" className="primary-button primary-button--wide" onClick={() => void submit()} disabled={pending}>{pending ? '发布中…' : '确认发布'}</button>
    </main>
  );
}
