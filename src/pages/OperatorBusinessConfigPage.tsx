import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Archive, RefreshCw, Save, Settings2 } from 'lucide-react';
import { api } from '../api/client';
import type { ActivityProposalStatus } from '../api/types';
import type { ConfigDomain, ConfigEntityType } from '../config/types';
import { queryKeys } from '../data/queryClient';

const domains: Array<{ key: ConfigDomain; label: string; entities: ConfigEntityType[] }> = [
  { key: 'activity-categories', label: '活动分类', entities: ['activity-category'] },
  { key: 'onboarding', label: '入门问卷', entities: ['onboarding-question', 'onboarding-option'] },
  { key: 'profile-options', label: '资料选项', entities: ['profile-option'] },
  { key: 'feedback-options', label: '反馈选项', entities: ['feedback-option'] },
  { key: 'recommendation', label: '推荐规则', entities: ['recommendation-rule', 'recommendation-setting'] },
];

const entityLabels: Record<ConfigEntityType, string> = {
  'activity-category': '活动分类',
  'onboarding-question': '问卷题目',
  'onboarding-option': '问卷选项',
  'profile-option': '资料选项',
  'feedback-option': '反馈选项',
  'recommendation-rule': '推荐规则',
  'recommendation-setting': '推荐参数',
};

type MutationMode = 'create' | 'update' | 'disable' | 'restore';

function parseValues(text: string): Record<string, unknown> {
  const value = text.trim() ? JSON.parse(text) : {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('配置值必须是 JSON 对象');
  return value as Record<string, unknown>;
}

export function OperatorBusinessConfigPage({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState<ConfigDomain>('activity-categories');
  const domainEntry = domains.find((item) => item.key === domain)!;
  const [entityType, setEntityType] = useState<ConfigEntityType>(domainEntry.entities[0]);
  const [mode, setMode] = useState<MutationMode>('create');
  const [key, setKey] = useState('');
  const [values, setValues] = useState('{\n  "label": "",\n  "themeKey": "other",\n  "iconKey": "sparkles",\n  "sortOrder": 0\n}');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const configQuery = useQuery({ queryKey: [...queryKeys.operatorConfig, domain], queryFn: () => api.operatorConfig(domain) });
  const auditQuery = useQuery({ queryKey: [...queryKeys.operatorConfig, domain, 'audit'], queryFn: () => api.operatorConfigAudit(domain, 30) });
  const proposalsQuery = useQuery({ queryKey: queryKeys.activityProposals, queryFn: () => api.activityProposals() });

  useEffect(() => {
    setEntityType(domainEntry.entities[0]);
    setNotice('');
  }, [domain, domainEntry.entities]);

  async function refreshAfterMutation() {
    await Promise.all([
      configQuery.refetch(),
      auditQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.config }),
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations }),
    ]);
  }

  async function mutateConfig(event: FormEvent) {
    event.preventDefault();
    const cleanKey = key.trim();
    if (!cleanKey || configQuery.data === undefined) return;
    setPending(true);
    setNotice('');
    try {
      const expectedRevision = configQuery.data.version;
      if (mode === 'create') await api.createOperatorConfig(domain, { entityType, key: cleanKey, expectedRevision, values: parseValues(values) });
      if (mode === 'update') await api.updateOperatorConfig(domain, cleanKey, { entityType, expectedRevision, values: parseValues(values) });
      if (mode === 'disable') await api.disableOperatorConfig(domain, cleanKey, { entityType, expectedRevision });
      if (mode === 'restore') await api.restoreOperatorConfig(domain, cleanKey, { entityType, expectedRevision });
      setNotice('配置已保存，前台缓存正在刷新。');
      await refreshAfterMutation();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : '配置保存失败');
    } finally {
      setPending(false);
    }
  }

  async function saveProposal(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotice('');
    try {
      await api.updateActivityProposal(id, {
        title: String(form.get('title') ?? ''),
        categoryKey: String(form.get('categoryKey') ?? ''),
        description: String(form.get('description') ?? ''),
        status: String(form.get('status') ?? '') as ActivityProposalStatus,
        reviewNote: String(form.get('reviewNote') ?? ''),
      });
      setNotice('活动提案已更新。');
      await proposalsQuery.refetch();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : '活动提案更新失败');
    }
  }

  async function archiveProposal(id: string) {
    try {
      await api.archiveActivityProposal(id);
      setNotice('活动提案已归档。');
      await proposalsQuery.refetch();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : '活动提案归档失败');
    }
  }

  return (
    <main className="operator-business page">
      <header className="subpage-header"><button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button><div><small>运营工作台</small><h1>业务配置与活动提案</h1></div></header>
      {notice ? <p className="operator-notice" role="status">{notice}</p> : null}
      <section className="operator-panel">
        <header><div><Settings2 size={19} /><h2>动态业务配置</h2></div><button type="button" onClick={() => void refreshAfterMutation()}><RefreshCw size={15} />刷新</button></header>
        <div className="operator-domain-tabs">{domains.map((item) => <button type="button" className={domain === item.key ? 'is-active' : ''} key={item.key} onClick={() => setDomain(item.key)}>{item.label}</button>)}</div>
        <p>当前版本：{configQuery.data?.version ?? '加载中'}。业务键发布后应保持稳定；停用项不会再用于新内容，历史内容仍可展示。</p>
        <pre className="operator-config-preview">{JSON.stringify(configQuery.data?.config ?? null, null, 2)}</pre>
        <form className="operator-config-form" onSubmit={(event) => void mutateConfig(event)}>
          <label>操作<select value={mode} onChange={(event) => setMode(event.target.value as MutationMode)}><option value="create">新建</option><option value="update">编辑</option><option value="disable">停用</option><option value="restore">恢复</option></select></label>
          <label>实体<select value={entityType} onChange={(event) => setEntityType(event.target.value as ConfigEntityType)}>{domainEntry.entities.map((item) => <option value={item} key={item}>{entityLabels[item]}</option>)}</select></label>
          <label>业务键<input value={key} onChange={(event) => setKey(event.target.value)} placeholder={entityType.endsWith('option') ? 'group::option_key' : 'stable_key'} /></label>
          {mode === 'create' || mode === 'update' ? <label>配置值 JSON<textarea value={values} onChange={(event) => setValues(event.target.value)} rows={10} spellCheck={false} /></label> : null}
          <button type="submit" className="primary-button" disabled={pending || !key.trim() || !configQuery.data}><Save size={16} />{pending ? '保存中…' : '提交配置'}</button>
        </form>
        <details><summary>最近审计记录（{auditQuery.data?.events.length ?? 0}）</summary><div className="operator-audit-list">{auditQuery.data?.events.map((event) => <p key={event.id}><b>v{event.revision} · {event.action}</b><span>{event.entityType} / {event.entityKey}</span><small>{event.createdAt}</small></p>)}</div></details>
      </section>

      <section className="operator-panel">
        <header><div><h2>活动提案</h2></div><button type="button" onClick={() => void proposalsQuery.refetch()}><RefreshCw size={15} />刷新</button></header>
        {!proposalsQuery.data?.proposals.length ? <div className="empty-state"><h3>暂无待处理提案</h3></div> : null}
        <div className="operator-proposal-list">{proposalsQuery.data?.proposals.map((proposal) => <form key={proposal.id} onSubmit={(event) => void saveProposal(event, proposal.id)}><label>标题<input name="title" defaultValue={proposal.title} /></label><label>分类键<input name="categoryKey" defaultValue={proposal.categoryKey} /></label><label>状态<select name="status" defaultValue={proposal.status}>{(['draft','submitted','accepted','rejected','withdrawn'] as const).map((status) => <option key={status}>{status}</option>)}</select></label><label>描述<textarea name="description" defaultValue={proposal.description} rows={4} /></label><label>处理说明<textarea name="reviewNote" defaultValue={proposal.reviewNote ?? ''} rows={2} /></label><p>主理人：{proposal.host.name} · {proposal.categoryLabel}</p><div><button type="submit" className="primary-button"><Save size={15} />保存编辑</button><button type="button" className="secondary-button" onClick={() => void archiveProposal(proposal.id)}><Archive size={15} />归档</button></div></form>)}</div>
      </section>
    </main>
  );
}
