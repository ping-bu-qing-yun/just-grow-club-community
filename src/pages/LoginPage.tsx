import { useState } from 'react';
import { ArrowRight, LockKeyhole, Phone } from 'lucide-react';

export function LoginPage({ login }: { login: (phone: string, password: string) => Promise<void> }) {
  const [phone, setPhone] = useState('13800000000');
  const [password, setPassword] = useState('qiahao123');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); setError(null); try { await login(phone, password); } catch (reason) { setError(reason instanceof Error ? reason.message : '登录失败'); } finally { setPending(false); } }
  return <main className="login-page"><div className="login-mark">恰好<span>·</span></div><p className="login-kicker">和刚刚好的人，去刚刚好的地方</p><form className="login-form" onSubmit={submit}><label><span>手机号</span><div className="login-input"><Phone size={17} aria-hidden="true" /><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" /></div></label><label><span>密码</span><div className="login-input"><LockKeyhole size={17} aria-hidden="true" /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" /></div></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="login-submit" type="submit" disabled={pending}>{pending ? '登录中…' : '登录'}<ArrowRight size={18} aria-hidden="true" /></button></form><p className="login-demo">演示账号已预填，可直接登录体验</p></main>;
}
