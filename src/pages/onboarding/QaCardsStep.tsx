import { useState } from 'react';
import { Mic, SkipForward } from 'lucide-react';
import { qaSets, type QaQuestion } from '../../club/seed';
import { useClub } from '../../club/ClubContext';

type QaMode = 'basic' | 'extra' | 'advanced';

const modeMeta: Record<QaMode, { label: string; subtitle: string; questions: QaQuestion[] }> = {
  basic: { label: '初级', subtitle: '必答 · 30秒', questions: qaSets.basic },
  extra: { label: '中级', subtitle: '加深 · 1分钟', questions: qaSets.extra },
  advanced: { label: '高级', subtitle: '选填 · 可稍后', questions: qaSets.advanced },
};

const divider = '｜';

export function QaCardsStep({ onNext }: { onNext: () => void }) {
  const { state, saveQaAnswer } = useClub();
  const [mode, setMode] = useState<QaMode>('basic');
  const [index, setIndex] = useState(0);
  const key = `${mode}:${index}`;
  const [value, setValue] = useState(state.qaAnswers[key] ?? '');
  const questions = modeMeta[mode].questions;
  const question = questions[index];
  const selected = value ? value.split(divider).filter(Boolean) : [];
  const canSkip = mode === 'advanced';
  const canContinue = canSkip || value.trim().length > 0;

  function switchMode(nextMode: QaMode) {
    setMode(nextMode);
    setIndex(0);
    setValue(state.qaAnswers[`${nextMode}:0`] ?? '');
  }

  function choose(option: string) {
    if (question.text) return;
    if (!question.multiple) {
      setValue(option);
      window.setTimeout(() => save(option), 120);
      return;
    }
    setValue(selected.includes(option) ? selected.filter((item) => item !== option).join(divider) : [...selected, option].join(divider));
  }

  function previous() {
    if (index > 0) {
      const nextIndex = index - 1;
      setIndex(nextIndex);
      setValue(state.qaAnswers[`${mode}:${nextIndex}`] ?? '');
      return;
    }
    if (mode === 'advanced') {
      setMode('extra');
      const nextIndex = qaSets.extra.length - 1;
      setIndex(nextIndex);
      setValue(state.qaAnswers[`extra:${nextIndex}`] ?? '');
      return;
    }
    if (mode === 'extra') {
      setMode('basic');
      const nextIndex = qaSets.basic.length - 1;
      setIndex(nextIndex);
      setValue(state.qaAnswers[`basic:${nextIndex}`] ?? '');
    }
  }

  function save(answer = value) {
    saveQaAnswer(key, answer);
    if (index < questions.length - 1) {
      const next = index + 1;
      setIndex(next);
      setValue(state.qaAnswers[`${mode}:${next}`] ?? '');
      return;
    }
    if (mode === 'basic') {
      switchMode('extra');
      return;
    }
    if (mode === 'extra') {
      switchMode('advanced');
      return;
    }
    onNext();
  }

  return (
    <section className="onboarding-body">
      <div className="onboarding-intro">
        <span>QA 问答 · {modeMeta[mode].subtitle}</span>
        <h1>慢一点，说一句真实的话</h1>
        <p>初级和中级用选择完成，高级可选答。答得越多，活动推荐和小CC提案越贴近。</p>
      </div>
      <div className="qa-levels">
        <button type="button" className={mode === 'basic' ? 'is-active' : ''} onClick={() => switchMode('basic')}>初级 · 4题</button>
        <button type="button" className={mode === 'extra' ? 'is-active' : ''} onClick={() => switchMode('extra')}>中级 · 4题</button>
        <button type="button" className={mode === 'advanced' ? 'is-active' : ''} onClick={() => switchMode('advanced')}>高级 · 3题</button>
      </div>
      <article className="qa-focus">
        <small>{index + 1} / {questions.length}</small>
        <h2>{question.title}</h2>
        {question.groups ? (
          <div className="qa-option-groups">
            {question.groups.map((group) => (
              <section key={group.label}>
                <b>{group.label}</b>
                <div className="qa-option-grid">{group.options.map((option) => <button type="button" className={selected.includes(option) ? 'is-active' : ''} onClick={() => choose(option)} key={option}>{option}</button>)}</div>
              </section>
            ))}
          </div>
        ) : null}
        {question.options ? (
          <div className="qa-option-grid">
            {question.options.map((option) => <button type="button" className={selected.includes(option) || value === option ? 'is-active' : ''} onClick={() => choose(option)} key={option}>{option}</button>)}
          </div>
        ) : null}
        {question.text ? (
          <>
            <textarea
              aria-label="当前回答"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={question.placeholder ?? '写下一句真实的话……'}
            />
            {question.voice ? (
              <button
                type="button"
                className="voice-action"
                onClick={() => setValue(value || '我需要亲密有间，彼此信任。不希望被干涉消费决定、兴趣爱好和社交方式。')}
              >
                <Mic size={18} />语音说一段
              </button>
            ) : null}
          </>
        ) : null}
      </article>
      <div className="onboarding-actions">
        {mode !== 'basic' || index > 0 ? <button type="button" className="secondary-button" onClick={previous}>上一题</button> : <span />}
        {mode !== 'basic' ? <button type="button" className="secondary-button" onClick={onNext}><SkipForward size={16} />跳到基础资料</button> : null}
        {(question.multiple || question.text) ? <button type="button" className="primary-button" disabled={!canContinue} onClick={() => save()}>{canSkip && !value.trim() ? '跳过高级题' : '下一题'}</button> : null}
      </div>
    </section>
  );
}
