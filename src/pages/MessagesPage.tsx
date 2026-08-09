import { ArrowLeft, BellRing, ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react';
import type { MessageThread } from '../domain/types';
import { useQiahao } from '../state/QiahaoContext';

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
      <aside className="message-safety-note"><ShieldCheck size={18} /><p>涉及集合地点、付款或联系方式时，请再次核对活动详情与对方身份。</p></aside>
    </main>
  );
}

