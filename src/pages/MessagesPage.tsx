import { BellRing, ChevronRight, MessageCircle } from 'lucide-react';
import { useQiahao } from '../state/QiahaoContext';

export function MessagesPage() {
  const { messages } = useQiahao();

  return (
    <main className="page standard-page standard-page--flush">
      <header className="page-header page-header--padded"><span className="eyebrow">TOGETHER</span><h1>消息</h1><p>重要集合信息，都在这里。</p></header>
      <section className="message-list" aria-label="消息列表">
        {messages.map((message) => (
          <button type="button" className="message-row" key={message.id}>
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

