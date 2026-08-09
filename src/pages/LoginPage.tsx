import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const DEMO_PHONE = '13800000000';
const DEMO_PASSWORD = 'qiahao123';

export function LoginPage({ login }: { login: (phone: string, password: string) => Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await login(DEMO_PHONE, DEMO_PASSWORD);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '暂时无法进入，请稍后再试');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-page welcome-login-page">
      <header className="welcome-login-nav">
        <button type="button" aria-label="返回" disabled>
          <ChevronLeft size={20} />
        </button>
        <div>
          <strong>恰好关系俱乐部</strong>
          <small>恰好欢迎页</small>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="welcome-screen" aria-label="恰好欢迎页">
        <div className="welcome-logo" aria-label="Just Grow Club">
          <span>Just</span>
          <small>Grow Club</small>
        </div>
        <div className="welcome-face" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <h1>让恰好的关系<br />从见面开始</h1>
        <button type="button" className="welcome-start" onClick={() => void start()} disabled={pending}>
          {pending ? '正在打开…' : '开始认识彼此'}
        </button>
        {error ? <p className="welcome-error" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}
