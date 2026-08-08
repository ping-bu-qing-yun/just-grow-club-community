import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export function CreateLifePage({
  onBack,
  onPublished,
}: {
  onBack: () => void;
  onPublished: () => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!text.trim()) {
      setError('先写下一句话');
      return;
    }
    onPublished();
  }

  return (
    <main className="create-need page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <small>发布生活</small>
          <h1>分享此刻的日常</h1>
        </div>
      </header>
      <p className="create-need-lead">不用很正式，像给朋友发一条近况就好。</p>
      <textarea
        aria-label="生活内容"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setError('');
        }}
        placeholder="比如：周末想找人一起去梧桐区散步……"
      />
      {error && <p className="field-error">{error}</p>}
      <button type="button" className="primary-button primary-button--wide" onClick={submit}>
        确认发布
      </button>
    </main>
  );
}
