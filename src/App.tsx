import { QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './app/AppRouter';
import { ClubProvider } from './club/ClubContext';
import { NotificationsProvider } from './notifications/NotificationContext';
import { QiahaoProvider } from './state/QiahaoContext';
import { queryClient } from './data/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <QiahaoProvider>
        <NotificationsProvider>
          <ClubProvider>
            <AppRouter />
          </ClubProvider>
        </NotificationsProvider>
      </QiahaoProvider>
    </QueryClientProvider>
  );
}
