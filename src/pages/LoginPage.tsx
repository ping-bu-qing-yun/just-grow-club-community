import { ChevronLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { quick } from '../motion/springs';
import styles from './LoginPage.module.css';

const DEMO_PHONE = '13800000000';
const DEMO_PASSWORD = 'qiahao123';

export function LoginPage({ login }: { login: (phone: string, password: string) => Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

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
    <main className={styles.page}>
      <header className={styles.nav}>
        <button type="button" aria-label="返回" disabled>
          <ChevronLeft size={20} />
        </button>
        <div>
          <strong>恰好关系俱乐部</strong>
          <small>恰好欢迎页</small>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className={styles.screen} aria-label="恰好欢迎页">
        <div className={styles.face} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <h1>让恰好的关系<br />从见面开始</h1>
        <motion.button
          type="button"
          className={styles.start}
          onClick={() => void start()}
          disabled={pending}
          whileTap={reducedMotion ? { opacity: 0.7 } : { scale: 0.97 }}
          transition={quick}
        >
          {pending ? '正在打开…' : '开始认识彼此'}
        </motion.button>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </section>
    </main>
  );
}
