import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BellRing, ChevronRight, MessageCircle, ShieldCheck, Send, Undo2 } from 'lucide-react';
import type { MessageThread } from '../domain/types';
import { useQiahao } from '../state/QiahaoContext';
import { messagesQueryOptions } from '../data/serverQueries';

export function MessagesPage({ onOpenThread }: { onOpenThread?: (thread: MessageThread) => void }) {
  const { messages } = useQiahao();

  return (
    <main className="page standard-page standard-page--flush">
      <header className="page-header page-header--padded"><span className="eyebrow">TOGETHER</span><h1>消息</h1><p>重要集合信息，都在这里。</p></header>
      <section className="message-list" aria-label="消息列表">
        {messages.map((message) => (
          <button type="button" className="message-row" key={message.id} onClick={() => onOpenThread?.(message)}>
            <span className={`message-avatar${message.system ? ' message-avatar--system' : ''}`}>
              {message.image ? <img src={message.image} alt="" /> : message.system ? <BellRing size={22} /> : <MessageCircle size={22} />}
            </span>
            <span className="message-copy"><strong>{message.title}</strong><span>{message.lastMessage}</span></span>
            <span className="message-meta"><small>{message.time}</small>{message.unread ? <b>{message.unread}</b> : <ChevronRight size={16} />}</span>
          </button>
        ))}
      </section>
    </main>
  );
}

export function MessageThreadPage({ thread, onBack }: { thread: MessageThread; onBack: () => void }) {
  const { localMode, user, sendThreadMessage, withdrawThreadMessage } = useQiahao();
  const messageQuery = useQuery({ ...messagesQueryOptions(user?.id ?? 'anonymous', thread.id), enabled: !localMode && Boolean(user) });
  const [previewMessages, setPreviewMessages] = useState<Array<{ id: string; senderId: string | null; body: string; withdrawn: boolean; createdAt: string }>>([]);
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const messages = localMode ? previewMessages : messageQuery.data?.messages ?? [];

  async function send() {
    const nextBody = body.trim();
    if (!nextBody || pending) return;
    setPending(true);
    setError('');
    try {
      const message = await sendThreadMessage(thread.id, nextBody);
      if (localMode) setPreviewMessages((current) => [...current, message]);
      setBody('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '消息发送失败');
    } finally {
      setPending(false);
    }
  }

  async function withdraw(messageId: string) {
    try {
      await withdrawThreadMessage(thread.id, messageId);
      if (localMode) setPreviewMessages((current) => current.map((message) => message.id === messageId ? { ...message, body: '', withdrawn: true } : message));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '消息撤回失败');
    }
  }

  return (
    <main className="page standard-page message-thread-page">
      <header className="subpage-header">
        <button type="button" aria-label="返回消息" onClick={onBack}><ArrowLeft /></button>
        <div><small>消息详情</small><h1>{thread.title}</h1></div>
      </header>
      <section className="message-thread-card">
        <span className={`message-avatar${thread.system ? ' message-avatar--system' : ''}`}>
          {thread.image ? <img src={thread.image} alt="" /> : thread.system ? <BellRing size={22} /> : <MessageCircle size={22} />}
        </span>
        <div><small>{thread.time}</small><p>{thread.lastMessage}</p></div>
      </section>
      <section className="message-thread-list" aria-label="会话消息">
        {messageQuery.isLoading && !localMode ? <p>正在加载消息…</p> : null}
        {messages.map((message) => <article className={message.senderId === user?.id ? 'is-mine' : ''} key={message.id}><p>{message.withdrawn ? '消息已撤回' : message.body}</p><small>{message.createdAt}</small>{message.senderId === user?.id && !message.withdrawn ? <button type="button" onClick={() => void withdraw(message.id)}><Undo2 size={14} />撤回</button> : null}</article>)}
      </section>
      <div className="message-composer"><textarea aria-label="输入消息" value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} placeholder="输入集合信息或聊天内容" /><button type="button" disabled={pending || !body.trim()} onClick={() => void send()}><Send size={17} />{pending ? '发送中…' : '发送'}</button></div>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <aside className="message-safety-note"><ShieldCheck size={18} /><p>涉及集合地点、付款或联系方式时，请再次核对活动详情与对方身份。</p></aside>
    </main>
  );
}

