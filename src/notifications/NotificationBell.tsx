import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationContext';

export function NotificationBell({ onOpen }: { onOpen: () => void }) {
  const { unreadCount } = useNotifications();
  const label = unreadCount > 0 ? `通知，有${unreadCount > 99 ? '99+' : unreadCount}条未读` : '通知';
  return (
    <button type="button" className="notification-bell icon-button" aria-label={label} onClick={onOpen}>
      <Bell size={20} />
      {unreadCount > 0 ? <i className="notification-bell__dot" aria-hidden="true" /> : null}
    </button>
  );
}
