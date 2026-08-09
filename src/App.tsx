import { AppRouter } from './app/AppRouter';
import { ClubProvider } from './club/ClubContext';
import { NotificationsProvider } from './notifications/NotificationContext';
import { QiahaoProvider } from './state/QiahaoContext';

export default function App() {
  return (
    <QiahaoProvider>
      <NotificationsProvider>
        <ClubProvider>
          <AppRouter />
        </ClubProvider>
      </NotificationsProvider>
    </QiahaoProvider>
  );
}
