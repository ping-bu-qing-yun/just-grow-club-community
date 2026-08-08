import { ArrowLeft, ArrowUpRight, Bell, ClipboardList, Heart, Megaphone, MessageCircle, ShieldCheck } from 'lucide-react';
import type { AppNotification, NotificationCategory } from '../notifications/types';

function iconFor(category: NotificationCategory) {
  if (category === 'announcement') return Megaphone;
  if (category === 'system') return ShieldCheck;
  if (category === 'like') return Heart;
  if (category === 'feedback') return ClipboardList;
  return MessageCircle;
}

function labelFor(category: NotificationCategory) {
  if (category === 'announcement') return '平台公告';
  if (category === 'system') return '系统消息';
  if (category === 'like') return '点赞提醒';
  if (category === 'feedback') return '活动反馈';
  return '评论回复';
}

function formattedTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function NotificationDetailPage({
  notification,
  onBack,
  onNavigate,
}: {
  notification: AppNotification;
  onBack: () => void;
  onNavigate: (notification: AppNotification) => void;
}) {
  const Icon = iconFor(notification.category);
  const canNavigate = notification.target && notification.target.type !== 'none';

  return (
    <main className="notification-detail page">
      <header className="notification-detail__header">
        <button type="button" className="icon-button" aria-label="返回通知" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span>通知详情</span>
        <i aria-hidden="true" />
      </header>
      <section className="notification-detail__body">
        <span className={`notification-icon notification-icon--${notification.category}`}>
          {notification.actor?.avatar ? <img src={notification.actor.avatar} alt="" /> : <Icon size={22} />}
        </span>
        <small>{labelFor(notification.category)}</small>
        <h1>{notification.title}</h1>
        <time>{formattedTime(notification.createdAt)}</time>
        <p>{notification.body}</p>
        {canNavigate ? (
          <button type="button" className="notification-detail__link" onClick={() => onNavigate(notification)}>
            {notification.target?.label ?? '查看相关内容'}
            <ArrowUpRight size={17} />
          </button>
        ) : (
          <div className="notification-detail__note">
            <Bell size={17} />
            这条提醒会保留在通知中心，方便你随时查看。
          </div>
        )}
      </section>
    </main>
  );
}
