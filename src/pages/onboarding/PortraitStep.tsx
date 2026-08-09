import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useQiahao } from '../../state/QiahaoContext';
import shared from './Onboarding.module.css';
import styles from './PortraitStep.module.css';

export function PortraitStep({ onComplete }: { onComplete: () => void }) {
  const { state, completeOnboarding } = useClub();
  const { saveOnboardingProgress, saveProfileRecord } = useQiahao();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    setPending(true);
    setError('');
    try {
      const completed = { ...state, onboardingComplete: true, onboardingStep: 3 };
      await saveOnboardingProgress(completed);
      await saveProfileRecord(completed);
      completeOnboarding();
      onComplete();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '画像保存失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={`${shared.body} ${styles.step}`}>
      <div className={styles.cover}>
        <Avatar src="/assets/avatar-me.jpg" name={state.profile.nickname} size={68} className={styles.coverAvatar} />
        <span className={styles.coverLabel}><Sparkles size={16} />初回画像</span>
        <h1>低压力线下重启型</h1>
        <p>{state.profile.nickname} · 画像完成度 42%</p>
      </div>
      <div className={styles.tags}>
        <span>想认识靠谱的人</span>
        <span className={styles.orange}>怕太像相亲</span>
        <span>适合少人数</span>
        <span className={styles.orange}>需要自然话题</span>
      </div>
      <blockquote className={styles.quote}>你不是不想认识人，只是想在舒服一点的地方开始。</blockquote>
      <div className={styles.compare}>
        <div>
          <b>适合先试试</b>
          <p>6-8人饭局<br />散步局<br />有主持人的 deep talk</p>
        </div>
        <div className={styles.avoid}>
          <b>先少推荐</b>
          <p>大型破冰<br />8分钟轮转<br />强目的相亲局</p>
        </div>
      </div>
      {error ? <p className={shared.formError} role="alert">{error}</p> : null}
      <Button wide disabled={pending} onClick={() => void finish()} icon={<ArrowRight size={18} />} className={styles.finish}>
        {pending ? '保存中…' : '去看活动'}
      </Button>
    </section>
  );
}
