import { useState } from 'react';
import { Mic, SkipForward } from 'lucide-react';
import { qaSets } from '../../club/seed';
import { useClub } from '../../club/ClubContext';

type QaMode = 'basic' | 'extra';

const modeMeta = {
  basic: { label: '初级', subtitle: '初级必答', questions: qaSets.basic },
  extra: { label: '中级', subtitle: '中级加深', questions: qaSets.extra },
} satisfies Record<QaMode, { label: string; subtitle: string; questions: string[] }>;

export function QaCardsStep({ onNext }: { onNext: () => void }) {
  const { state, saveQaAnswer } = useClub();
  const [mode, setMode] = useState<QaMode>('basic');
  const [index, setIndex] = useState(0);
  const key = `${mode}:${index}`;
  const [value, setValue] = useState(state.qaAnswers[key] ?? '');
  const questions = modeMeta[mode].questions;
  const question = questions[index];

  function switchMode(nextMode: QaMode) {
    setMode(nextMode);
    setIndex(0);
    setValue(state.qaAnswers[`${nextMode}:0`] ?? '');
  }

  function save() {
    saveQaAnswer(key, value);
    if (index < questions.length - 1) {
      const next = index + 1;
      setIndex(next);
      setValue(state.qaAnswers[`${mode}:${next}`] ?? '');
      return;
    }
    onNext();
  }

  return (
    <section className="onboarding-body">
      <div className="onboarding-intro">
        <span>QA 问答 · {modeMeta[mode].subtitle}</span>
        <h1>慢一点，说一句真实的话</h1>
        <p>自我探知、生活共识、情感理念。中级题可选答，答得越多推荐越贴近。</p>
      </div>
      <div className="qa-levels">
        <button type="button" className={mode === 'basic' ? 'is-active' : ''} onClick={() => switchMode('basic')}>初级 · 3题</button>
        <button type="button" className={mode === 'extra' ? 'is-active' : ''} onClick={() => switchMode('extra')}>中级 · 6题</button>
        <button type="button" disabled>高级 · 稍后</button>
      </div>
      <article className="qa-focus">
        <small>{index + 1} / {questions.length}</small>
        <h2>{question}</h2>
        <textarea
          aria-label="当前回答"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="写下一句，或用语音说一段……"
        />
        <button
          type="button"
          className="voice-action"
          onClick={() => setValue(value || '我更喜欢自然、不用刻意表现自己的时刻。')}
        >
          <Mic size={18} />语音说一段
        </button>
      </article>
      <div className="onboarding-actions">
        <button type="button" className="secondary-button" onClick={onNext}><SkipForward size={16} />跳到基础资料</button>
        <button type="button" className="primary-button" disabled={!value.trim()} onClick={save}>保存并继续</button>
      </div>
    </section>
  );
}
