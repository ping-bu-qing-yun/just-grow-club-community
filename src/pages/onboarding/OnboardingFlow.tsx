import { ArrowLeft } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { LightQuestionsStep } from './LightQuestionsStep';
import { QaCardsStep } from './QaCardsStep';
import { BasicProfileStep } from './BasicProfileStep';
import { PortraitStep } from './PortraitStep';
import { IntroLetterStep } from './IntroLetterStep';

const labels = ['三问入门', 'QA 问答', '基础资料', '画像生成'];

export function OnboardingFlow({
  onBackStart,
  onComplete,
}: {
  onBackStart: () => void;
  onComplete: () => void;
}) {
  const { state, setOnboardingStep } = useClub();
  const step = state.onboardingStep;
  const next = () => setOnboardingStep(Math.min(4, step + 1));
  const back = () => {
    if (step === 0) {
      onBackStart();
      return;
    }
    setOnboardingStep(step - 1);
  };

  if (step === 0) {
    return <IntroLetterStep onNext={next} />;
  }

  const headerStep = Math.min(3, step - 1);

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <button aria-label="返回上一步" onClick={back}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <small>{labels[headerStep]}</small>
          <div className="onboarding-progress">
            {labels.map((label, index) => (
              <i key={label} className={index <= headerStep ? 'is-active' : ''} />
            ))}
          </div>
        </div>
        <span>{headerStep + 1}/4</span>
      </header>
      {step === 1 ? (
        <LightQuestionsStep onNext={next} />
      ) : step === 2 ? (
        <QaCardsStep onNext={next} />
      ) : step === 3 ? (
        <BasicProfileStep onNext={next} />
      ) : (
        <PortraitStep onComplete={onComplete} />
      )}
    </main>
  );
}
