import { useState } from 'react';
import { useClub } from '../../club/ClubContext';
import { useQiahao } from '../../state/QiahaoContext';

const previewQuestions = [
  ['你最近最想解决什么？', ['想认识靠谱的人', '想自然一点脱单', '想找能深聊的人', '想扩大线下社交圈', '想理解关系模式', '暂时不确定']],
  ['你更容易接受哪种见面场景？', ['少人数饭局', '轻松散步', '主题 deep talk', '共同兴趣活动', '关系工作坊', '小组匹配']],
  ['你最大的出门阻力是什么？', ['怕尴尬', '怕人多', '怕太像相亲', '怕聊不起来', '地点太远', '不知道来的人怎样']],
].map(([prompt, options], index) => ({ key: `light:${index}`, prompt: String(prompt), required: true, options: (options as string[]).map((value) => ({ key: value, label: value, value })) }));

export function LightQuestionsStep({ onNext }: { onNext: () => void }) {
  const { state, toggleLightAnswer } = useClub();
  const { businessConfig, localMode, saveOnboardingProgress } = useQiahao();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const questions = businessConfig?.onboarding.filter((question) => question.sectionKey === 'light') ?? (localMode ? previewQuestions : []);
  const valid = questions.length > 0 && questions.every((question, index) => !question.required || (state.lightAnswers[index] ?? []).length > 0);
  async function continueFlow() {
    setPending(true);
    setError('');
    try {
      await saveOnboardingProgress({ ...state, onboardingStep: 1 });
      onNext();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '问卷保存失败');
    } finally {
      setPending(false);
    }
  }
  return <section className="onboarding-body"><div className="onboarding-intro"><span>三问入门 · 约30秒</span><h1>你的回答就是最好的自我介绍</h1><p>先用三个轻问题，让我们知道你最近真正想要什么。</p></div>{questions.map((question,index)=><div className="question-section" key={question.key}><div className="question-title"><b>{index+1}</b><h2>{question.prompt}</h2></div><div className="answer-grid">{question.options.map(option=><button type="button" className={(state.lightAnswers[index] ?? []).includes(option.value)?'is-active':''} onClick={()=>toggleLightAnswer(index,option.value)} key={option.key}>{option.label}</button>)}</div></div>)}{!questions.length ? <p className="form-error" role="alert">问卷配置暂时不可用，请稍后重试。</p> : null}{error ? <p className="form-error" role="alert">{error}</p> : null}<button type="button" className="primary-button primary-button--wide" disabled={!valid || pending} onClick={() => void continueFlow()}>{pending ? '保存中…' : '继续到 QA 问答'}</button></section>;
}
