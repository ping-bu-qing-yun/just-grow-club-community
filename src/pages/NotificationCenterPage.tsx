import { ArrowLeft, Bell, BellOff, CheckCheck, ChevronRight, Heart, Megaphone, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNotifications } from '../notifications/NotificationContext';
import type { AppNotification, NotificationCategory } from '../notifications/types';

type NotificationFilter = 'all' | NotificationCategory;

const filters: Array<{ value: NotificationFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'announcement', label: '公告' },
  { value: 'system', label: '系统' },
  { value: 'like', label: '点赞' },
  { value: 'comment', label: '评论' },
];

function iconFor(category: NotificationCategory) {
  if (category === 'announcement') return Megaphone;
  if (category === 'system') return ShieldCheck;
  if (category === 'like') return Heart;
  return MessageCircle;
}

function labelFor(category: NotificationCategory) {
  if (category === 'announcement') return '平台公告';
  if (category === 'system') return '系统消息';
  if (category === 'like') return '点赞提醒';
  return '评论回复';
}

function timestamp(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '刚刚';
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}分钟前`;
  if (diff < 86_400_000) return `${Math.max(1, Math.floor(diff / 3_600_000))}小时前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function NotificationCenterPage({ onBack, onOpen }: { onBack: () => void; onOpen: (notification: AppNotification) => void }) {
  const { notifications, unreadCount, status, error, clearRead, refresh } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const visibleNotifications = useMemo(() => filter === 'all' ? notifications : notifications.filter((notification) => notification.category === filter), [filter, notifications]);
  const hasRead = notifications.some((notification) => notification.read);

  return (
    <main className="notification-page page">
      <header className="notification-header">
        <button type="button" className="icon-button" aria-label="返回活动" onClick={onBack}><ArrowLeft size={20} /></button>
        <div><span>NOTIFICATION</span><h1>通知</h1></div>
        <button type="button" className="notification-clear" disabled={!hasRead} onClick={clearRead}>
          <CheckCheck size={16} />
          清空已读
        </button>
      </header>

      <nav className="notification-filters" aria-label="通知分类">
        {filters.map((item) => (
            <button type="button" key={item.value} className={filter === item.value ? 'is-active' : ''} aria-label={item.label} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
            {item.label}{item.value === 'all' && unreadCount > 0 ? <b>{unreadCount > 99 ? '99+' : unreadCount}</b> : null}
          </button>
        ))}
      </nav>

      {status === 'loading' && notifications.length === 0 ? (
        <section className="notification-loading" role="status"><Bell size={22} /><span>正在加载通知…</span></section>
      ) : null}

      {error ? (
        <section className="notification-error" role="alert">
          <span>{error}，已保留本地通知。</span>
          <button type="button" onClick={() => void refresh()}><RefreshCw size={15} />重试</button>
        </section>
      ) : null}

      {visibleNotifications.length ? (
        <section className="notification-list" aria-label="通知列表">
          {visibleNotifications.map((notification) => {
            const Icon = iconFor(notification.category);
            return (
              <button type="button" className={`notification-row${notification.read ? ' is-read' : ''}`} key={notification.id} onClick={() => onOpen(notification)}>
                <span className={`notification-icon notification-icon--${notification.category}`}>
                  {notification.actor?.avatar ? <img src={notification.actor.avatar} alt="" /> : <Icon size={20} />}
                </span>
                <span className="notification-copy">
                  <span className="notification-copy__title"><strong>{notification.title}</strong>{!notification.read ? <i aria-label="未读通知" /> : null}</span>
                  <span>{notification.body}</span>
                  <small>{labelFor(notification.category)} · {timestamp(notification.createdAt)}</small>
                </span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            );
          })}
        </section>
      ) : status !== 'loading' ? (
        <section className="notification-empty">
          <BellOff size={31} />
          <h2>{filter === 'all' ? '暂时没有新通知' : '这个分类还没有通知'}</h2>
          <p>新的公告、系统消息、点赞和评论回复都会出现在这里。</p>
        </section>
      ) : null}
    </main>
  );
}
