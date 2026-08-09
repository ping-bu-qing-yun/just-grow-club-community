import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { ArrowLeft, Bot, CalendarDays, Check, ChevronRight, Coins, Eye, Lightbulb, Megaphone, Pencil, Send, ShieldAlert, Sparkles, UsersRound, X } from 'lucide-react';
import type { ClubActivity, Need } from '../club/types';
import { clubActivities } from '../club/seed';
import { useQiahao } from '../state/QiahaoContext';

type AdminView = 'home' | 'proposals' | 'detail' | 'daily' | 'revenue' | 'activities' | 'activity-detail' | 'confirm' | 'push' | 'preview';
type ProposalStatus = 'pending' | 'approved' | 'rejected';
type ActivityPhase = 'pre' | 'mature' | 'recruiting' | 'feedback' | 'ended';

interface ProposalStage {
  time: string;
  title: string;
  goal: string;
  script: string;
  cards: string[];
  tip: string;
}

interface Proposal {
  id: string;
  code: string;
  status: ProposalStatus;
  resonance: number;
  title: string;
  core: string;
  tags: string[];
  fromDemand: string;
  insight: string;
  info: [string, string][];
  flow: ProposalStage[];
  mechanics: string[];
  attract: string;
  resolve: string;
  risk: string;
}

interface ManagedActivity {
  activity: ClubActivity;
  phase: ActivityPhase;
  signups: number;
  views: number;
  feedbacks: number;
  score: number;
}

const baseProposals: Proposal[] = [
  {
    id: 'p-low-pressure',
    code: 'A',
    status: 'pending',
    resonance: 72,
    title: '周末低压力认识局',
    core: '不做自我介绍，我们还能认识彼此吗？',
    tags: ['低压力', '少人数', '怕尴尬'],
    fromDemand: '想认识靠谱的人，但怕太像相亲',
    insight: '72 条需求里反复出现三个词：怕像面试、不想交换微信、想自然一点。真正卡住大家的不是没有见面机会，而是见面时那套「介绍自己-评价对方」的脚本，让人一开口就不像自己。',
    info: [['形式', '轻餐 + 三段式话题局'], ['时间', '周五 20:00-22:00'], ['地点', '大学路合作空间'], ['人数', '6 人，男女尽量均衡'], ['费用', '共创支持 ¥69 / 人'], ['主持', '小CC + 关系小芽话题卡']],
    flow: [
      { time: '20:00-20:20', title: 'Part 1 · 不许介绍自己', goal: '先卸掉社交面具，让人以「具体的生活」出场，而不是简历。', script: '今晚有个规矩：前 20 分钟，谁都不许说自己做什么工作、在哪里上班。', cards: ['最近一次让你觉得「这一天没白过」的小事是什么？', '你手机里有一张舍不得删、但也没发出去的照片，是什么？', '这一个月你重复听得最多的一首歌，为什么是它？'], tip: '不轮流发言。小CC 先答自己那一题，把第一个开口的压力接过来。' },
      { time: '20:20-21:10', title: 'Part 2 · 关系里的真实困惑', goal: '从「聊得来」进到「聊得深」，同时保留随时退出的权利。', script: '接下来这些问题没有标准答案，也可以选择跳过。', cards: ['你上一次心动是什么时候？那个瞬间具体发生了什么？', '在关系里，你最怕自己变成什么样子？', '如果对方说「我需要一点空间」，你第一反应是什么？'], tip: '每题后留 30 秒安静时间，避免有人为了接话而表演。' },
      { time: '21:10-22:00', title: 'Part 3 · 自由靠近与收束', goal: '给愿意继续聊的人留空间，也让不想继续的人体面离开。', script: '接下来大家可以自由换座，也可以提前离开，不用打招呼。', cards: ['你还想继续问谁一个问题？', '今天哪一句话让你有一点点被理解？'], tip: '在小程序里匿名标记「想继续认识」，双向匹配才互推联系方式。' },
    ],
    mechanics: ['话题卡抽取制，避免轮流发言的表演感', '跳过权：任何问题都可以不答', '双向匿名标记，不打扰、不尴尬', '小CC 亲自参与，不做旁观式主持'],
    attract: '25-35 岁，真心想认识人但明确排斥相亲流程的人。他们通常已经拒绝过好几场「介绍局」。',
    resolve: '解决「见了面不知道聊什么」和「怕被当成候选人评估」两个最高频顾虑。',
    risk: '男女比例失衡会让话题走向单一，报名时需做软性配平；若有人连续跳过 3 张卡，小CC 需私下确认状态。',
  },
  {
    id: 'p-work-reset',
    code: 'B',
    status: 'pending',
    resonance: 45,
    title: '心动变难之后 · 从 0 到 1 工作坊',
    core: '亲密关系，到底如何从 0 到 1 建立？',
    tags: ['关系困惑', '工作坊', '30岁前后'],
    fromDemand: '不是不想恋爱，是越来越难进入关系',
    insight: '不少用户不是没意愿，而是被过往关系和工作节奏训练得越来越谨慎。需要一个允许慢慢拆解、不急着配对的练习场。',
    info: [['形式', '关系说明书工作坊'], ['时间', '周日 14:00-17:00'], ['地点', '安福路共创客厅'], ['人数', '8-10 人'], ['费用', '共创支持 ¥99 / 人'], ['主持', '小CC + 关系说明书模板']],
    flow: [
      { time: '14:00-14:30', title: 'Part 1 · 我的关系启动方式', goal: '让参与者看见自己靠近关系的节奏。', script: '我们先不谈理想对象，先谈自己通常怎么开始靠近。', cards: ['你通常什么时候会想再见一个人？', '你最怕一段关系太快发生什么？'], tip: '先个人书写，再两人互换，不做公开点评。' },
      { time: '14:30-15:40', title: 'Part 2 · 关系说明书共创', goal: '把模糊偏好写成可被理解的语言。', script: '这不是自我包装，而是让别人知道怎样靠近你不会受伤。', cards: ['我需要被怎样确认？', '我不喜欢被怎样推进？'], tip: '小CC 准备示例，降低书写门槛。' },
      { time: '15:50-17:00', title: 'Part 3 · 轻量匹配与复盘', goal: '让有共鸣的人自然留下下一步。', script: '你可以只带走自己的说明书，也可以留下想继续聊的人。', cards: ['今天谁的哪句话让你想继续问下去？'], tip: '只推双向选择，不公开配对结果。' },
    ],
    mechanics: ['个人书写先于社交', '双人互读降低公开表达压力', '关系说明书可沉淀到用户画像', '活动后用反馈优化推荐'],
    attract: '对关系认真，但目前对进入关系有迟疑的人。',
    resolve: '解决「不是没需求，而是不知道怎么重新开始」的问题。',
    risk: '主题较深，需提前说明不是心理咨询；现场要避免互相诊断。',
  },
  {
    id: 'p-value-night',
    code: 'C',
    status: 'pending',
    resonance: 28,
    title: '价值观夜谈',
    core: '什么样的分歧，你愿意用一辈子去面对？',
    tags: ['deep talk', '价值观', '长期关系'],
    fromDemand: '想找能聊价值观的人，而不是只聊工作',
    insight: '这类用户对「热闹」兴趣不高，更在意真实表达和长期关系里的判断方式。活动应小规模、低噪音、强边界。',
    info: [['形式', '5 人围坐夜谈'], ['时间', '周四 19:30-21:30'], ['地点', '安福路小客厅'], ['人数', '5 人'], ['费用', '共创支持 ¥49 / 人'], ['主持', '小CC']],
    flow: [
      { time: '19:30-19:50', title: 'Part 1 · 一句话入场', goal: '快速建立主题边界。', script: '用一句话说说，你最近最在意的关系问题。', cards: ['关系里你最不愿意牺牲什么？'], tip: '每人 2 分钟，避免展开太快。' },
      { time: '19:50-20:50', title: 'Part 2 · 价值观分歧卡', goal: '用具体情境讨论抽象价值观。', script: '我们不争对错，只讲自己会怎么选择。', cards: ['伴侣长期异地但很稳定，你会怎么判断？', '对方收入不稳定但热爱自己的事，你怎么看？'], tip: '小CC 及时收束争辩。' },
      { time: '20:50-21:30', title: 'Part 3 · 继续认识的信号', goal: '让相似价值观的人留下后续可能。', script: '你可以写下今天最想继续聊的一个问题。', cards: ['你愿意下一次继续聊哪个话题？'], tip: '活动后推送同频问题，不直接推人。' },
    ],
    mechanics: ['情境卡代替立场辩论', '不公开评价他人选择', '小规模保证表达密度'],
    attract: '喜欢深聊、排斥流水线相亲、愿意认真听别人说话的人。',
    resolve: '解决「线上很难判断价值观是否同频」的问题。',
    risk: '话题易变重，需准备轻松收束问题，并控制单人表达时长。',
  },
];

const revenueMonths = [
  { label: '2026年 8月 · 本月至今', signups: 118, acts: 11, amount: 9260 },
  { label: '2026年 7月', signups: 96, acts: 9, amount: 7640 },
  { label: '2026年 6月', signups: 88, acts: 8, amount: 6980 },
  { label: '2026年 5月', signups: 71, acts: 7, amount: 5320 },
];
const revenueYears = [
  { label: '2026年', signups: 465, acts: 42, amount: 35900 },
  { label: '2025年', signups: 328, acts: 31, amount: 24680 },
];

function classifyNeed(need: Need): string {
  const text = `${need.title}${need.copy}${need.tags.join('')}`.toLowerCase();
  if (text.includes('附近') || text.includes('散步') || text.includes('周末')) return '附近生活与轻同行';
  if (text.includes('deep') || text.includes('价值观') || text.includes('深')) return '深度关系与价值观';
  if (text.includes('看展') || text.includes('咖啡') || text.includes('运动')) return '兴趣同行';
  return '低压力认识';
}

function proposalToActivity(proposal: Proposal, status: ClubActivity['status'] = '预活动'): ClubActivity {
  const info = new Map(proposal.info);
  return {
    id: `proposal-${proposal.id}`,
    theme: proposal.tags.includes('deep talk') ? 'deep' : 'low',
    status,
    title: proposal.title,
    tags: proposal.tags,
    description: proposal.core,
    image: proposal.id === 'p-value-night' ? '/assets/coffee.jpg' : proposal.id === 'p-work-reset' ? '/assets/art.jpg' : '/assets/food.jpg',
    date: info.get('时间') ?? '待定',
    location: info.get('地点') ?? '待定',
    people: info.get('人数') ?? '6人',
    fee: info.get('费用')?.replace('共创支持 ', '').replace(' / 人', '') ?? '待定',
    needs: proposal.tags,
    timeRange: info.get('时间') ?? '待定',
    audience: proposal.attract,
    flow: proposal.flow.map((stage) => ({ title: stage.title, body: `${stage.goal} ${stage.tip}` })),
    boundary: '不强制交换联系方式，所有问题都可以跳过；双向确认后才互推联系方式。',
    pitch: proposal.core,
    matchLabel: status === '预活动' ? 'AI提案' : '已确认',
  };
}

function phaseFromActivity(activity: ClubActivity, index: number): ActivityPhase {
  if (activity.status === '预活动') return 'pre';
  if (index % 5 === 0) return 'ended';
  if (index % 4 === 0) return 'feedback';
  if (index % 2 === 0) return 'recruiting';
  return 'mature';
}

function phaseLabel(phase: ActivityPhase): string {
  return { pre: '预活动', mature: '成熟活动', recruiting: '报名中', feedback: '待反馈', ended: '已结束' }[phase];
}

function parseFee(fee: string): number {
  const value = Number.parseInt(fee.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(value) ? value : 0;
}

export function AdminContentPage({ onBack, onGenerateActivity }: { onBack: () => void; onGenerateActivity?: (activity: ClubActivity) => void }) {
  const { user, needs, lifePosts, messages } = useQiahao();
  const [view, setView] = useState<AdminView>('home');
  const [selectedProposalId, setSelectedProposalId] = useState(baseProposals[0].id);
  const [selectedActivityId, setSelectedActivityId] = useState(clubActivities[0].id);
  const [statuses, setStatuses] = useState<Record<string, ProposalStatus>>({});
  const [activityPhases, setActivityPhases] = useState<Record<string, ActivityPhase>>({});
  const [generatedActivities, setGeneratedActivities] = useState<ClubActivity[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Pick<Proposal, 'title' | 'core' | 'insight'>>>({});
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityPhase | 'all'>('all');
  const [revenueMode, setRevenueMode] = useState<'month' | 'year'>('month');
  const [confirmChecks, setConfirmChecks] = useState<string[]>([]);
  const [pushDraft, setPushDraft] = useState({ title: '这场低压力认识局，适合怕尴尬但想认真认识人的你', value: '不做自我介绍，用三段式话题让关系自然发生。', audience: '低压力认识、少人数、怕尴尬用户', sent: false });

  const proposals = useMemo(
    () => baseProposals.map((proposal) => ({ ...proposal, ...drafts[proposal.id], status: statuses[proposal.id] ?? proposal.status })),
    [drafts, statuses],
  );
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0];
  const generatedActivity = proposalToActivity(selectedProposal);
  const allActivities = useMemo(() => [...generatedActivities, ...clubActivities], [generatedActivities]);
  const managedActivities = useMemo<ManagedActivity[]>(
    () =>
      allActivities.map((activity, index) => ({
        activity,
        phase: activityPhases[activity.id] ?? phaseFromActivity(activity, index),
        signups: Math.max(1, (index + 2) * 3),
        views: 47 + index * 38,
        feedbacks: index % 3 === 0 ? 8 : index % 2 === 0 ? 3 : 0,
        score: 4.5 + (index % 4) * 0.1,
      })),
    [activityPhases, allActivities],
  );
  const selectedManagedActivity = managedActivities.find((item) => item.activity.id === selectedActivityId) ?? managedActivities[0];

  const demandClusters = useMemo(() => {
    const map = new Map<string, { label: string; count: number; resonance: number; examples: Need[] }>();
    for (const need of needs) {
      const label = classifyNeed(need);
      const current = map.get(label) ?? { label, count: 0, resonance: 0, examples: [] };
      current.count += 1;
      current.resonance += need.resonance;
      current.examples = [...current.examples, need].slice(0, 3);
      map.set(label, current);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [needs]);

  if (user?.role !== 'operator') {
    return <main className="page standard-page"><button type="button" className="icon-button" aria-label="返回" onClick={onBack}><ArrowLeft /></button><div className="empty-state"><ShieldAlert size={28} /><h2>无权访问</h2><p>运营权限由服务器确认。</p></div></main>;
  }

  const estimatedRevenue = revenueMonths[0].amount;
  const pendingCount = proposals.filter((proposal) => proposal.status === 'pending').length;
  const preCount = managedActivities.filter((item) => item.phase === 'pre').length;
  const feedbackCount = managedActivities.filter((item) => item.phase === 'feedback').length;
  const metrics = [
    { label: '入住用户', value: String(128 + needs.length + lifePosts.length), icon: UsersRound, target: 'daily' as AdminView },
    { label: '待拍板提案', value: String(pendingCount), icon: Bot, target: 'proposals' as AdminView },
    { label: '本月收入', value: `¥${estimatedRevenue.toLocaleString('zh-CN')}`, icon: Coins, target: 'revenue' as AdminView },
    { label: '预活动', value: String(preCount), icon: CalendarDays, target: 'activities' as AdminView },
  ];

  const previewActivity = selectedManagedActivity?.activity ?? generatedActivity;

  function go(next: AdminView, keepNotice = false) {
    setView(next);
    if (!keepNotice) setNotice('');
    setEditing(false);
    window.scrollTo({ top: 0 });
  }

  function openProposal(proposal: Proposal) {
    setSelectedProposalId(proposal.id);
    go('detail');
  }

  function approveProposal() {
    const nextActivity = proposalToActivity(selectedProposal);
    setStatuses((current) => ({ ...current, [selectedProposal.id]: 'approved' }));
    setGeneratedActivities((current) => [nextActivity, ...current.filter((item) => item.id !== nextActivity.id)]);
    setActivityPhases((current) => ({ ...current, [nextActivity.id]: 'pre' }));
    setSelectedActivityId(nextActivity.id);
    onGenerateActivity?.(nextActivity);
    go('preview', true);
    setNotice('已同意，预活动已生成，可在活动管理里继续运营确认');
  }

  function rejectProposal() {
    setStatuses((current) => ({ ...current, [selectedProposal.id]: 'rejected' }));
    go('proposals', true);
    setNotice('已拒绝这份提案，小芽会减少相似生成方向');
  }

  function confirmActivity() {
    if (!selectedManagedActivity) return;
    const matureActivity = { ...selectedManagedActivity.activity, status: '成熟活动' as const, matchLabel: '已确认' };
    setGeneratedActivities((current) => [matureActivity, ...current.filter((item) => item.id !== matureActivity.id)]);
    setActivityPhases((current) => ({ ...current, [matureActivity.id]: 'mature' }));
    onGenerateActivity?.(matureActivity);
    go('activity-detail', true);
    setNotice('已转为成熟活动，现在可以开启 AI 推送招募');
  }

  function sendPush() {
    if (!selectedManagedActivity) return;
    setPushDraft((current) => ({ ...current, sent: true }));
    setActivityPhases((current) => ({ ...current, [selectedManagedActivity.activity.id]: 'recruiting' }));
    go('activity-detail', true);
    setNotice('AI 推送已整理并发出，活动状态已进入报名中');
  }

  const filteredActivities = managedActivities.filter((item) => activityFilter === 'all' || item.phase === activityFilter);

  return (
    <main className="page standard-page admin-content-page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={view === 'home' ? onBack : () => go('home')}><ArrowLeft /></button>
        <div><small>小CC管理</small><h1>{viewTitle(view)}</h1></div>
      </header>
      {notice ? <p className="operator-notice">{notice}</p> : null}

      {view === 'home' ? (
        <>
          <section className="operator-metrics">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return <button type="button" key={metric.label} onClick={() => go(metric.target)}><Icon size={16} /><b>{metric.value}</b><span>{metric.label}</span></button>;
            })}
          </section>
          <section className="admin-action-card">
            <small>管理动作</small>
            <button type="button" onClick={() => go('proposals')}><span className="admin-action-icon">AI</span><b>AI 活动提案</b><em>基于高频需求生成可发起的见面</em><ChevronRight /></button>
            <button type="button" onClick={() => go('daily')}><span className="admin-action-icon">芽</span><b>小CC 每日分身</b><em>关系小芽替你盯着今天</em><ChevronRight /></button>
            <button type="button" onClick={() => go('revenue')}><span className="admin-action-icon is-money">¥</span><b>经营明细</b><em>本月 ¥{estimatedRevenue.toLocaleString('zh-CN')} · 按月/按年看收入</em><ChevronRight /></button>
            <button type="button" onClick={() => go('activities')}><span className="admin-action-icon">活</span><b>活动管理</b><em>预活动、报名、反馈、评分一览</em><ChevronRight /></button>
            <button type="button" onClick={() => setNotice('消息中心将在下一步接入企微提醒和用户反馈线程')}><span className="admin-action-icon">信</span><b>我的消息</b><em>系统通知 / 用户联系 / 反馈提醒</em><i>{messages.length}</i><ChevronRight /></button>
          </section>
          <DemandInsight clusters={demandClusters} />
        </>
      ) : null}

      {view === 'proposals' ? <ProposalList proposals={proposals} pendingCount={pendingCount} onOpen={openProposal} /> : null}
      {view === 'detail' ? (
        <ProposalDetail
          proposal={selectedProposal}
          editing={editing}
          setEditing={setEditing}
          setDrafts={setDrafts}
          onApprove={approveProposal}
          onReject={rejectProposal}
          onBack={() => go('proposals')}
        />
      ) : null}
      {view === 'preview' ? <ActivityPreview activity={previewActivity} onActivities={() => go('activities')} onProposals={() => go('proposals')} /> : null}
      {view === 'daily' ? <DailyPage needs={needs} pendingCount={pendingCount} feedbackCount={feedbackCount} proposals={proposals} onOpenProposal={openProposal} onDraft={() => openProposal(proposals[0])} /> : null}
      {view === 'revenue' ? <RevenuePage mode={revenueMode} setMode={setRevenueMode} /> : null}
      {view === 'activities' ? (
        <ActivitiesManagePage
          activities={filteredActivities}
          filter={activityFilter}
          setFilter={setActivityFilter}
          onOpen={(item) => {
            setSelectedActivityId(item.activity.id);
            go('activity-detail');
          }}
        />
      ) : null}
      {view === 'activity-detail' && selectedManagedActivity ? (
        <ActivityManageDetail item={selectedManagedActivity} onConfirm={() => go('confirm')} onPush={() => go('push')} onPreview={() => go('preview')} />
      ) : null}
      {view === 'confirm' && selectedManagedActivity ? (
        <ActivityConfirmPage item={selectedManagedActivity} checks={confirmChecks} setChecks={setConfirmChecks} onSubmit={confirmActivity} />
      ) : null}
      {view === 'push' && selectedManagedActivity ? (
        <PushPage item={selectedManagedActivity} draft={pushDraft} setDraft={setPushDraft} onSend={sendPush} />
      ) : null}
    </main>
  );
}

function viewTitle(view: AdminView): string {
  return {
    home: '运营工作台',
    proposals: 'AI 活动提案',
    detail: '提案详情',
    daily: '小CC 每日分身',
    revenue: '经营明细',
    activities: '活动一览',
    'activity-detail': '活动详情',
    confirm: '运营确认',
    push: 'AI 推送招募',
    preview: '用户端预览',
  }[view];
}

function DemandInsight({ clusters }: { clusters: Array<{ label: string; count: number; resonance: number; examples: Need[] }> }) {
  return (
    <section className="operator-panel">
      <header><span>DEMAND INSIGHT</span><h2>需求分类洞察</h2></header>
      <div className="operator-clusters">
        {clusters.map((cluster) => (
          <article key={cluster.label}>
            <div><b>{cluster.label}</b><span>{cluster.count} 条需求 · {cluster.resonance} 人共鸣</span></div>
            <p>{cluster.examples.map((need) => need.title).join(' / ')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProposalList({ proposals, pendingCount, onOpen }: { proposals: Proposal[]; pendingCount: number; onOpen: (proposal: Proposal) => void }) {
  return (
    <section className="admin-proposal-page">
      <header className="operator-title-row"><h2>AI活动提案</h2><span>{pendingCount}条待判断</span></header>
      <p>每一份提案都用同一套模板生成：核心命题 → 需求洞察 → 细化流程 → 现场提问 → 吸引谁。小CC 只需要判断：要不要做。</p>
      <div className="admin-proposal-list">
        {proposals.map((proposal) => (
          <article key={proposal.id}>
            <div className="admin-proposal-card-head"><b>提案 {proposal.code}｜{proposal.title}</b><span className={`proposal-status is-${proposal.status}`}>{proposal.status === 'pending' ? '待拍板' : proposal.status === 'approved' ? '已通过' : '已拒绝'}</span></div>
            <small>{proposal.resonance} 人共鸣 · {proposal.tags.join(' · ')}</small>
            <div className="proposal-core">核心命题：{proposal.core}</div>
            <p>{proposal.flow.length} 段流程 · {proposal.flow.reduce((sum, stage) => sum + stage.cards.length, 0)} 道现场提问<br />回应需求「{proposal.fromDemand}」</p>
            <button type="button" onClick={() => onOpen(proposal)}>看完整提案</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProposalDetail({
  proposal,
  editing,
  setEditing,
  setDrafts,
  onApprove,
  onReject,
  onBack,
}: {
  proposal: Proposal;
  editing: boolean;
  setEditing: (value: boolean | ((current: boolean) => boolean)) => void;
  setDrafts: Dispatch<SetStateAction<Record<string, Pick<Proposal, 'title' | 'core' | 'insight'>>>>;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}) {
  return (
    <section className="proposal-detail">
      <header className="proposal-detail-hero">
        <span>提案{proposal.code} · {proposal.status === 'pending' ? '待拍板' : proposal.status === 'approved' ? '已通过' : '已拒绝'}</span>
        {editing ? (
          <>
            <input value={proposal.title} onChange={(event) => setDrafts((current) => ({ ...current, [proposal.id]: { title: event.target.value, core: proposal.core, insight: proposal.insight } }))} />
            <textarea value={proposal.core} onChange={(event) => setDrafts((current) => ({ ...current, [proposal.id]: { title: proposal.title, core: event.target.value, insight: proposal.insight } }))} />
          </>
        ) : (
          <>
            <h2>{proposal.title}</h2>
            <b>核心命题：{proposal.core}</b>
          </>
        )}
        <p>{proposal.resonance} 人共鸣 · 回应需求「{proposal.fromDemand}」</p>
      </header>
      <ProposalBlock index={1} title="为什么是这场（需求洞察）">
        {editing ? <textarea value={proposal.insight} onChange={(event) => setDrafts((current) => ({ ...current, [proposal.id]: { title: proposal.title, core: proposal.core, insight: event.target.value } }))} /> : <p>{proposal.insight}</p>}
      </ProposalBlock>
      <ProposalBlock index={2} title="活动基本盘"><div className="proposal-info-table">{proposal.info.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></ProposalBlock>
      <ProposalBlock index={3} title="细化流程与现场提问">
        <p>共 {proposal.flow.length} 段，{proposal.flow.reduce((sum, stage) => sum + stage.cards.length, 0)} 道提问。每段都写清了目标、小CC 怎么开口、用哪些问题，以及要避的坑。</p>
        <div className="proposal-stage-list">
          {proposal.flow.map((stage) => (
            <article key={stage.title}>
              <header><b>{stage.title}</b><span>{stage.time}</span></header>
              <div className="stage-goal">目标：{stage.goal}</div>
              <div className="stage-script"><strong>小CC 现场怎么开口</strong><p>{stage.script}</p></div>
              <ul>{stage.cards.map((card) => <li key={card}>{card}</li>)}</ul>
              <p className="stage-tip">{stage.tip}</p>
            </article>
          ))}
        </div>
      </ProposalBlock>
      <ProposalBlock index={4} title="互动机制"><ul className="proposal-bullet-list">{proposal.mechanics.map((item) => <li key={item}>{item}</li>)}</ul></ProposalBlock>
      <ProposalBlock index={5} title="这场提案凭什么成立">
        <div className="proposal-verdict"><b>能吸引到谁</b><p>{proposal.attract}</p></div>
        <div className="proposal-verdict is-warm"><b>解决什么困惑</b><p>{proposal.resolve}</p></div>
        <div className="proposal-verdict is-cool"><b>风险与提醒</b><p>{proposal.risk}</p></div>
      </ProposalBlock>
      <div className="proposal-actions">
        {editing ? <button type="button" onClick={() => setEditing(false)}><Check size={17} />保存修改</button> : <button type="button" onClick={onApprove}><Check size={17} />同意，生成预活动</button>}
        <button type="button" onClick={() => setEditing((value) => !value)}><Pencil size={17} />{editing ? '取消编辑' : '修改内容'}</button>
        <button type="button" className="is-danger" onClick={onReject}><X size={17} />拒绝这份提案</button>
        <button type="button" className="is-muted" onClick={onBack}>返回提案列表</button>
      </div>
    </section>
  );
}

function ActivityPreview({ activity, onActivities, onProposals }: { activity: ClubActivity; onActivities: () => void; onProposals: () => void }) {
  return (
    <section className="admin-preview">
      <header className="operator-title-row"><h2>用户端预览</h2><span>{activity.status}</span></header>
      <article className="club-feature admin-preview-card">
        <img src={activity.image} alt="" />
        <div><small>{activity.status} · {activity.matchLabel}</small><h2>{activity.title}</h2><p>{activity.people} · {activity.location} · {activity.date}</p></div>
      </article>
      <section className="operator-panel"><header><span>SHOW TO USER</span><h2>对外展示信息</h2></header><p>{activity.pitch}</p><div className="club-tags">{activity.tags.map((tagItem) => <span key={tagItem}>{tagItem}</span>)}</div></section>
      <div className="proposal-actions"><button type="button" onClick={onActivities}><Eye size={17} />进入活动管理</button><button type="button" className="is-muted" onClick={onProposals}>返回提案列表</button></div>
    </section>
  );
}

function DailyPage({ needs, pendingCount, feedbackCount, proposals, onOpenProposal, onDraft }: { needs: Need[]; pendingCount: number; feedbackCount: number; proposals: Proposal[]; onOpenProposal: (proposal: Proposal) => void; onDraft: () => void }) {
  return (
    <section className="cc-daily-page">
      <section className="cc-daily-hero"><span><Sparkles size={18} /></span><div><small>关系小芽 · 小CC 的每日分身</small><h2>今天，我帮你盯着这几件事</h2></div></section>
      <div className="cc-daily-metrics">
        <article><b>{needs.length}</b><span>今日新增需求</span><em>待回应</em></article>
        <article><b>{pendingCount}</b><span>待你拍板提案</span><em>AI 已起草</em></article>
        <article><b>1</b><span>报名/缴费异常</span><em>需跟进</em></article>
        <article><b>{feedbackCount}</b><span>待收反馈</span><em>已结束</em></article>
      </div>
      <section className="operator-panel cc-brief"><header><h2>小芽的今日简报</h2><span>08-09 早</span></header><p>昨晚「深度对谈夜局」刚结束，有 1 位用户还没写反馈；广场上“想认识靠谱的人”又多了几条共鸣，已经快到成局线。我建议你今天先做三件事：</p><ul><li>把「周末低压力认识局」从预活动升级</li><li>给犹豫的用户发一条轻提醒</li><li>起草一份「附近早餐局」承接新需求</li></ul></section>
      <section className="operator-panel"><header><h2>待你拍板</h2><span>{pendingCount} 条</span></header><div className="cc-pending-list">{proposals.map((proposal) => <button type="button" key={proposal.id} onClick={() => onOpenProposal(proposal)}><b>提案 {proposal.code}｜{proposal.title}</b><span>{proposal.resonance} 人共鸣 · {proposal.flow.length} 段流程</span><em>去拍板</em></button>)}<button type="button"><b>1 人报名夜谈但余额不足</b><span>需要你决定是否保留名额</span><em>发提醒</em></button></div><p className="cc-note">点任意一条会打开完整提案，看清流程和现场提问后再决定同意还是拒绝。</p></section>
      <section className="operator-panel cc-suggest"><header><h2>小芽想跟你说</h2></header><p>你一个人运营很累，这些重复的活我来扛。今天要不要我直接起草一份「附近早餐局」？你点一下就能发出去。</p><div><button type="button" onClick={onDraft}>好，起草一份</button><button type="button">稍后再说</button></div></section>
    </section>
  );
}

function RevenuePage({ mode, setMode }: { mode: 'month' | 'year'; setMode: (mode: 'month' | 'year') => void }) {
  const data = mode === 'month' ? revenueMonths : revenueYears;
  const current = data[0];
  const max = Math.max(...data.map((item) => item.amount));
  return (
    <section className="revenue-page">
      <header className="operator-title-row"><h2>经营明细</h2><span>报名与收入</span></header>
      <div className="revenue-tabs"><button type="button" className={mode === 'month' ? 'is-active' : ''} onClick={() => setMode('month')}>按月看</button><button type="button" className={mode === 'year' ? 'is-active' : ''} onClick={() => setMode('year')}>按年看</button></div>
      <section className="revenue-hero"><span>{mode === 'month' ? '本月收入' : '本年收入'}</span><b>¥{current.amount.toLocaleString('zh-CN')}</b><p>{current.label} · {current.signups} 人次报名 · {current.acts} 场活动</p></section>
      <div className="revenue-summary"><article><b>¥{Math.round(current.amount / current.signups)}</b><span>人均客单</span><small>{current.acts} 场活动</small></article><article><b>¥{Math.round(current.amount / current.acts).toLocaleString('zh-CN')}</b><span>单场平均收入</span><small>{(current.signups / current.acts).toFixed(1)} 人/场</small></article></div>
      <section className="operator-panel"><header><h2>{mode === 'month' ? '近 6 个月' : '近 2 年'}</h2><span>累计 ¥{data.reduce((sum, item) => sum + item.amount, 0).toLocaleString('zh-CN')}</span></header><div className="revenue-list">{data.map((item) => <article key={item.label}><div><b>{item.label}</b><strong>¥{item.amount.toLocaleString('zh-CN')}</strong></div><span>{item.signups} 人次报名 · {item.acts} 场活动</span><i><em style={{ width: `${Math.round((item.amount / max) * 100)}%` }} /></i></article>)}</div></section>
    </section>
  );
}

function ActivitiesManagePage({ activities, filter, setFilter, onOpen }: { activities: ManagedActivity[]; filter: ActivityPhase | 'all'; setFilter: (filter: ActivityPhase | 'all') => void; onOpen: (item: ManagedActivity) => void }) {
  const filters: Array<[ActivityPhase | 'all', string]> = [['all', '全部'], ['recruiting', '报名中'], ['pre', '预活动'], ['feedback', '待反馈'], ['ended', '已结束']];
  return (
    <section className="activity-manage-page">
      <header className="operator-title-row"><h2>活动一览</h2><span>按进展阶段</span></header>
      <div className="activity-stage-filter">{filters.map(([value, label]) => <button type="button" className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)} key={value}>{label}</button>)}</div>
      <div className="admin-activity-list">
        {activities.map((item) => (
          <button type="button" key={item.activity.id} onClick={() => onOpen(item)}>
            <img src={item.activity.image} alt="" />
            <div><b>{item.activity.title}</b><span>{phaseLabel(item.phase)} · {item.signups} 人报名 · {item.views} 看过</span></div>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}

function ActivityManageDetail({ item, onConfirm, onPush, onPreview }: { item: ManagedActivity; onConfirm: () => void; onPush: () => void; onPreview: () => void }) {
  const activity = item.activity;
  return (
    <section className="activity-manage-detail">
      <div className="activity-admin-hero"><img src={activity.image} alt="" /><span>{phaseLabel(item.phase)}</span><h2>{activity.title}</h2><p>{activity.pitch || activity.description}</p></div>
      <section className="operator-panel"><header><h2>运营数据</h2><span>{item.score.toFixed(1)} 分</span></header><div className="activity-kpi-grid"><article><b>{item.views}</b><span>看过</span></article><article><b>{item.signups}</b><span>报名/预约</span></article><article><b>{item.feedbacks}</b><span>反馈</span></article><article><b>¥{(parseFee(activity.fee) * item.signups).toLocaleString('zh-CN')}</b><span>预计收入</span></article></div></section>
      <section className="operator-panel"><header><h2>活动信息</h2><span>可编辑</span></header><div className="proposal-info-table"><div><span>时间</span><b>{activity.timeRange}</b></div><div><span>地点</span><b>{activity.location}</b></div><div><span>人数</span><b>{activity.people}</b></div><div><span>费用</span><b>{activity.fee}</b></div><div><span>适合谁</span><b>{activity.audience}</b></div></div></section>
      <section className="operator-panel"><header><h2>流程亮点</h2></header><div className="activity-flow-mini">{activity.flow.map((step) => <article key={step.title}><b>{step.title}</b><p>{step.body}</p></article>)}</div></section>
      <div className="proposal-actions">
        {item.phase === 'pre' ? <button type="button" onClick={onConfirm}><Check size={17} />运营确认 · 转成熟活动</button> : <button type="button" onClick={onPush}><Megaphone size={17} />AI 整理推送招募</button>}
        <button type="button" onClick={onPreview}><Eye size={17} />预览给用户看</button>
      </div>
    </section>
  );
}

function ActivityConfirmPage({ item, checks, setChecks, onSubmit }: { item: ManagedActivity; checks: string[]; setChecks: Dispatch<SetStateAction<string[]>>; onSubmit: () => void }) {
  const options = ['时间与地点已最终确定', '人数上限与费用已确认无误', '现场流程与安全须知已检查', '已安排主理人 / 小CC 现场引导'];
  const ready = options.every((option) => checks.includes(option));
  return (
    <section className="activity-confirm-page">
      <section className="operator-panel"><header><h2>预活动已收集到足够兴趣</h2><span>{item.signups} 人预约</span></header><p>请核对后确认上线。提交后这场活动会从预活动转为成熟活动，并可以开启 AI 推送招募。</p></section>
      <section className="operator-panel"><header><h2>运营摘要</h2></header><div className="proposal-info-table"><div><span>活动</span><b>{item.activity.title}</b></div><div><span>时间</span><b>{item.activity.timeRange}</b></div><div><span>地点</span><b>{item.activity.location}</b></div><div><span>人数费用</span><b>{item.activity.people} · {item.activity.fee}</b></div></div></section>
      <section className="operator-panel"><header><h2>确认清单</h2><span>{checks.length}/4</span></header><div className="confirm-checks">{options.map((option) => <label key={option}><input type="checkbox" checked={checks.includes(option)} onChange={(event) => setChecks((current) => event.target.checked ? [...current, option] : current.filter((itemText) => itemText !== option))} /><span>{option}</span></label>)}</div></section>
      <div className="proposal-actions"><button type="button" disabled={!ready} onClick={onSubmit}><Check size={17} />确认转为成熟活动</button></div>
    </section>
  );
}

function PushPage({ item, draft, setDraft, onSend }: { item: ManagedActivity; draft: { title: string; value: string; audience: string; sent: boolean }; setDraft: Dispatch<SetStateAction<{ title: string; value: string; audience: string; sent: boolean }>>; onSend: () => void }) {
  return (
    <section className="push-page">
      <section className="operator-panel"><header><span>AI PUSH</span><h2>智能推送招募</h2></header><p>小芽已根据活动标签、历史参与、收藏和需求共鸣整理招募文案。小CC 可以编辑后推送到首页推荐和企微客户朋友圈。</p></section>
      <label className="admin-field"><span>推送标题</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
      <label className="admin-field"><span>核心价值</span><textarea value={draft.value} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} /></label>
      <label className="admin-field"><span>面向群体</span><input value={draft.audience} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value }))} /></label>
      <section className="operator-panel"><header><h2>预览</h2><span>{item.activity.title}</span></header><div className="push-preview"><b>{draft.title}</b><p>{draft.value}</p><span>{item.activity.timeRange} · {item.activity.location}</span></div></section>
      <div className="proposal-actions"><button type="button" onClick={onSend}><Send size={17} />确认推送并进入报名中</button></div>
    </section>
  );
}

function ProposalBlock({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return <section className="proposal-block"><h3><span>{index}</span>{title}</h3>{children}</section>;
}
