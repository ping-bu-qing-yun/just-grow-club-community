import { ArrowLeft } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { LightQuestionsStep } from './LightQuestionsStep';
import { QaCardsStep } from './QaCardsStep';
import { BasicProfileStep } from './BasicProfileStep';
import { PortraitStep } from './PortraitStep';
import styles from './Onboarding.module.css';

const labels = ['三问入门', 'QA 问答', '基础资料', '画像生成'];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { state, setOnboardingStep } = useClub();
  const step = state.onboardingStep;
  const next = () => setOnboardingStep(Math.min(3, step + 1));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="返回上一步" disabled={step === 0} onClick={() => setOnboardingStep(step - 1)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <small>{labels[step]}</small>
          <div className={styles.progress}>
            {labels.map((label, index) => (
              <i key={label} className={index <= step ? styles.active : ''} />
            ))}
          </div>
        </div>
        <span className={styles.stepCount}>{step + 1}/4</span>
      </header>
      {step === 0 ? <LightQuestionsStep onNext={next} /> : step === 1 ? <QaCardsStep onNext={next} /> : step === 2 ? <BasicProfileStep onNext={next} /> : <PortraitStep onComplete={onComplete} />}
    </main>
  );
}
