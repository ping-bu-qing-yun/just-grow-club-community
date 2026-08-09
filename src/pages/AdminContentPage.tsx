import { useEffect, useState } from 'react';
import { ArrowLeft, Archive, Check, EyeOff, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { api } from '../api/client';
import type { AdminContentItem, ApiContentTag, ContentStatus, ContentType } from '../api/types';
import { useQiahao } from '../state/QiahaoContext';

const statusLabels: Record<ContentStatus, string> = { draft: '草稿', pending: '待审核', approved: '已通过', rejected: '已驳回', archived: '已归档', hidden: '已隐藏' };
const typeLabels: Record<ContentType, string> = { activity: '活动', need: '需求', life: '生活' };

export function AdminContentPage({ onBack }: { onBack: () => void }) {
  const { user, localMode } = useQiahao();
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [tags, setTags] = useState<ApiContentTag[]>([]);
  const [type, setType] = useState<ContentType | ''>('');
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [tag, setTag] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function load() {
    if (user?.role !== 'operator') return;
    if (localMode) {
      setItems([]);
      setTags([]);
      setError(null);
      return;
    }
    try {
      const [content, tagResult] = await Promise.all([
        api.adminContent({ type: type || undefined, status: status || undefined, tag: tag || undefined }),
        api.adminTags(type || undefined),
      ]);
      setItems(content.items);
      setTags(tagResult.tags);
      setError(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '治理数据加载失败');
    }
  }

  useEffect(() => { void load(); }, [user?.role, localMode, type, status, tag]);

  async function changeStatus(item: AdminContentItem, next: Exclude<ContentStatus, 'draft'>) {
    setPending(item.id);
    try {
      await api.updateContentStatus(item.id, next, reason || undefined);
      setReason('');
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '状态更新失败');
    } finally {
      setPending(null);
    }
  }

  async function toggleTag(item: ApiContentTag) {
    try {
      const { tag: updated } = await api.updateTag(item.id, { enabled: !item.enabled });
      setTags((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '标签更新失败');
    }
  }

  if (user?.role !== 'operator') {
    return <main className="page standard-page"><button type="button" className="icon-button" aria-label="返回" onClick={onBack}><ArrowLeft /></button><div className="empty-state"><ShieldAlert size={28} /><h2>无权访问</h2><p>运营权限由服务器确认。</p></div></main>;
  }

  return (
    <main className="page standard-page admin-content-page">
      <header className="subpage-header"><button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button><div><small>OPERATOR</small><h1>内容治理</h1></div><button type="button" className="icon-button" aria-label="刷新" onClick={() => void load()}><RotateCcw size={18} /></button></header>
      <div className="admin-filters"><label>类型<select value={type} onChange={(event) => setType(event.target.value as ContentType | '')}><option value="">全部类型</option><option value="activity">活动</option><option value="need">需求</option><option value="life">生活</option></select></label><label>状态<select value={status} onChange={(event) => setStatus(event.target.value as ContentStatus | '')}><option value="">全部状态</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>标签<select value={tag} onChange={(event) => setTag(event.target.value)}><option value="">全部标签</option>{tags.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="form-field admin-reason"><span>审核备注</span><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="驳回或归档时可填写原因" /></label>
      <div className="admin-content-list">{items.length === 0 ? <div className="empty-state"><Archive size={28} /><h2>暂无匹配内容</h2><p>调整筛选条件后再查看。</p></div> : items.map((item) => <article className="admin-content-item" key={item.id}><div className="admin-content-item__meta"><span>{typeLabels[item.contentType]}</span><b>{statusLabels[item.status]}</b><small>{item.author.name} · {new Date(item.createdAt).toLocaleString('zh-CN')}</small></div><h2>{item.title || '未命名内容'}</h2><p>{item.body}</p><div className="club-tags">{item.tags.map((itemTag) => <span key={itemTag.id}>{itemTag.label}</span>)}</div>{item.rejectionReason && <small className="admin-rejection">审核备注：{item.rejectionReason}</small>}<div className="admin-content-item__actions">{item.status === 'draft' && <button type="button" onClick={() => void changeStatus(item, 'pending')} disabled={pending === item.id}><RotateCcw size={15} />送审</button>}{item.status === 'pending' && <><button type="button" onClick={() => void changeStatus(item, 'approved')} disabled={pending === item.id}><Check size={15} />通过</button><button type="button" onClick={() => void changeStatus(item, 'rejected')} disabled={pending === item.id}><X size={15} />驳回</button></>}{item.status === 'approved' && <><button type="button" onClick={() => void changeStatus(item, 'hidden')} disabled={pending === item.id}><EyeOff size={15} />隐藏</button><button type="button" onClick={() => void changeStatus(item, 'rejected')} disabled={pending === item.id}><X size={15} />驳回</button><button type="button" onClick={() => void changeStatus(item, 'archived')} disabled={pending === item.id}><Archive size={15} />归档</button></>}{item.status === 'rejected' && <><button type="button" onClick={() => void changeStatus(item, 'pending')} disabled={pending === item.id}><RotateCcw size={15} />重新审核</button><button type="button" onClick={() => void changeStatus(item, 'archived')} disabled={pending === item.id}><Archive size={15} />归档</button></>}{item.status === 'hidden' && <><button type="button" onClick={() => void changeStatus(item, 'approved')} disabled={pending === item.id}><Check size={15} />恢复公开</button><button type="button" onClick={() => void changeStatus(item, 'archived')} disabled={pending === item.id}><Archive size={15} />归档</button></>}</div></article>)}</div>
      <section className="admin-tags"><h2>标签维护</h2>{tags.map((item) => <div className="admin-tag-row" key={item.id}><span>{item.label}</span><small>{typeLabels[item.contentType]} · {item.slug}</small><button type="button" onClick={() => void toggleTag(item)}>{item.enabled ? '停用' : '启用'}</button></div>)}</section>
    </main>
  );
}
