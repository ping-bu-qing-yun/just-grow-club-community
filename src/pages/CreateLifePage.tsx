import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useQiahao } from '../state/QiahaoContext';

export function CreateLifePage({ onBack, onPublished }: { onBack: () => void; onPublished: () => void }) {
  const { createLifePost, localMode } = useQiahao();
  const [text, setText] = useState('');
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
      await createLifePost(text.trim());
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
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="button" className="primary-button primary-button--wide" onClick={() => void submit()} disabled={pending}>{pending ? '发布中…' : '确认发布'}</button>
    </main>
  );
}
