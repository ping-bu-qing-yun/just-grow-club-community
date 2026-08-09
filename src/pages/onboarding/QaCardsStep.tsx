import { useState } from 'react';
import { Mic,SkipForward } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { useQiahao } from '../../state/QiahaoContext';

const previewQuestions = [
  '最近一次让你觉得“做自己很舒服”的时刻是什么？',
  '你理想中的周末，通常会怎么度过？',
  '一段关系里，你最希望被怎样理解？',
].map((prompt, index) => ({ key: `qa:basic:${index}`, prompt, required: true }));

export function QaCardsStep({ onNext }: { onNext: () => void }) {
  const { state, saveQaAnswer } = useClub();
  const { businessConfig, localMode, saveOnboardingProgress } = useQiahao();
  const questions = businessConfig?.onboarding.filter((question) => question.sectionKey === 'qa-basic') ?? (localMode ? previewQuestions : []);
  const canSkip = questions.every((item) => !item.required);
  const [index,setIndex]=useState(0);
  const question = questions[index];
  const [value,setValue]=useState(question ? state.qaAnswers[question.key] ?? '' : '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function save(){
    if (!question) return;
    const qaAnswers = { ...state.qaAnswers, [question.key]: value };
    const last = index >= questions.length - 1;
    setPending(true);
    setError('');
    try {
      await saveOnboardingProgress({ ...state, qaAnswers, onboardingStep: last ? 2 : 1 });
      saveQaAnswer(question.key,value);
      if(!last){const next=index+1;setIndex(next);setValue(state.qaAnswers[questions[next].key]??'')}else onNext();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '问答保存失败');
    } finally {
      setPending(false);
    }
  }
  if (!question) return <section className="onboarding-body"><p className="form-error" role="alert">问答配置暂时不可用，请稍后重试。</p></section>;
  return <section className="onboarding-body"><div className="onboarding-intro"><span>QA 问答 · 初级必答</span><h1>慢一点，说一句真实的话</h1><p>自我探知、生活共识、情感理念。中高级题以后可以继续。</p></div><div className="qa-levels"><button type="button" className="is-active">初级 · {questions.length}题</button><button type="button">中级 · 稍后</button><button type="button">高级 · 稍后</button></div><article className="qa-focus"><small>{index+1} / {questions.length}</small><h2>{question.prompt}</h2><textarea aria-label="当前回答" value={value} onChange={event=>setValue(event.target.value)} placeholder="写下一句，或用语音说一段……"/><button type="button" className="voice-action" onClick={()=>setValue(value||'我更喜欢自然、不用刻意表现自己的时刻。')}><Mic size={18}/>语音说一段</button></article>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="onboarding-actions">{canSkip ? <button type="button" className="secondary-button" disabled={pending} onClick={onNext}><SkipForward size={16}/>跳到基础资料</button> : null}<button type="button" className="primary-button" disabled={!value.trim() || pending} onClick={() => void save()}>{pending ? '保存中…' : '保存并继续'}</button></div></section>;
}
