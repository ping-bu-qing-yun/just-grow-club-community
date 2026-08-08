import { useState } from 'react';
import { AppShell } from './components/AppShell';
import type { AppTab } from './components/BottomNav';
import { PublishTypeSheet, type PublishKind } from './components/PublishTypeSheet';
import type { ClubActivity, Need } from './club/types';
import { ClubProvider, useClub } from './club/ClubContext';
import { QiahaoProvider, useQiahao } from './state/QiahaoContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingFlow } from './pages/onboarding/OnboardingFlow';
import { ActivitiesHomePage } from './pages/ActivitiesHomePage';
import { ExplorePage } from './pages/ExplorePage';
import { NeedsPage } from './pages/NeedsPage';
import { NeedDetailPage } from './pages/NeedDetailPage';
import { ClubActivityDetailPage } from './pages/ClubActivityDetailPage';
import { ProfilePage, type ProfileDestination } from './pages/ProfilePage';
import { ProfileEditorPage } from './pages/ProfileEditorPage';
import { ProfileRecordsPage } from './pages/ProfileRecordsPage';
import { CreateActivityPage } from './pages/CreateActivityPage';
import { CreateNeedPage } from './pages/CreateNeedPage';
import { CreateLifePage } from './pages/CreateLifePage';
import { MessagesPage } from './pages/MessagesPage';
import { SavedPage } from './pages/SavedPage';
import { Toast } from './components/Toast';
import { canPublishActivity } from './domain/roles';
import { NotificationsProvider, useNotifications } from './notifications/NotificationContext';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { NotificationDetailPage } from './pages/NotificationDetailPage';
import type { AppNotification } from './notifications/types';
import { clubActivities, seedNeeds } from './club/seed';

function QiahaoApp() {
  const { status, error, retry, login, user } = useQiahao();
  const { state } = useClub();
  const { notifications, markRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<AppTab>('activities');
  const [subview, setSubview] = useState<string | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [selectedClubActivity, setSelectedClubActivity] = useState<ClubActivity | null>(null);
  const [notificationSubview, setNotificationSubview] = useState<'center' | 'detail' | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  if (status === 'anonymous') return <LoginPage login={login} />;
  if (status === 'loading') return <main className="app-state"><p>正在打开恰好…</p></main>;
  if (status === 'error') {
    return (
      <main className="app-state">
        <p>{error ?? '暂时无法连接服务器'}</p>
        <button onClick={retry}>重试</button>
      </main>
    );
  }
  if (!state.onboardingComplete) {
    return <OnboardingFlow onComplete={() => { setActiveTab('activities'); setSubview(null); }} />;
  }

  function changeTab(tab: AppTab) {
    setActiveTab(tab);
    setSubview(null);
    setSelectedNeed(null);
    setSelectedClubActivity(null);
    setNotificationSubview(null);
    setSelectedNotification(null);
    setPublishOpen(false);
    window.scrollTo({ top: 0 });
  }

  function profileNavigate(destination: ProfileDestination) {
    if (destination === 'portrait') return;
    if (destination === 'dynamics') return changeTab('needs');
    setSubview(destination);
    window.scrollTo({ top: 0 });
  }

  function openPublish() {
    setPublishOpen(true);
  }

  function selectPublish(kind: PublishKind) {
    setPublishOpen(false);
    setSelectedNeed(null);
    setSelectedClubActivity(null);
    if (kind === 'activity') setSubview('create-activity');
    if (kind === 'need') setSubview('create-need');
    if (kind === 'life') setSubview('create-life');
    window.scrollTo({ top: 0 });
  }

  function openClubActivity(activity: ClubActivity) {
    setSelectedNeed(null);
    setSelectedClubActivity(activity);
    setPublishOpen(false);
    window.scrollTo({ top: 0 });
  }

  function openNotifications() {
    setSelectedNeed(null);
    setSelectedClubActivity(null);
    setSubview(null);
    setNotificationSubview('center');
    setSelectedNotification(null);
    window.scrollTo({ top: 0 });
  }

  function openNotification(notification: AppNotification) {
    markRead(notification.id);
    setSelectedNotification(notification);
    setNotificationSubview('detail');
    window.scrollTo({ top: 0 });
  }

  function navigateFromNotification(notification: AppNotification) {
    setNotificationSubview(null);
    setSelectedNotification(null);
    if (notification.target?.type === 'activity') {
      const activity = clubActivities.find((item) => item.id === notification.target?.id);
      if (activity) return openClubActivity(activity);
      setToast('相关活动暂时无法打开');
      return;
    }
    if (notification.target?.type === 'need') {
      const need = [...state.publishedNeeds, ...seedNeeds].find((item) => item.id === notification.target?.id);
      if (need) return setSelectedNeed(need);
      setToast('相关需求暂时无法打开');
      return;
    }
    if (notification.target?.type === 'messages') setSubview('messages');
  }

  let content;
  if (notificationSubview === 'center') content = <NotificationCenterPage onBack={() => setNotificationSubview(null)} onOpen={openNotification} />;
  else if (notificationSubview === 'detail' && selectedNotification) content = <NotificationDetailPage notification={selectedNotification} onBack={() => setNotificationSubview('center')} onNavigate={navigateFromNotification} />;
  else if (selectedNeed) content = <NeedDetailPage need={selectedNeed} onBack={() => setSelectedNeed(null)} />;
  else if (selectedClubActivity) {
    content = (
      <ClubActivityDetailPage
        activity={selectedClubActivity}
        onBack={() => setSelectedClubActivity(null)}
        onNotice={setToast}
      />
    );
  } else if (subview === 'editor') content = <ProfileEditorPage onBack={() => setSubview(null)} />;
  else if (subview === 'messages') content = <MessagesPage />;
  else if (subview === 'saved-activities') {
    content = <SavedPage onExplore={() => changeTab('explore')} onOpenActivity={() => setToast('活动详情已打开')} />;
  } else if (subview === 'saved-needs' || subview === 'attended') {
    content = <ProfileRecordsPage kind={subview} onBack={() => setSubview(null)} />;
  } else if (subview === 'create-activity') {
    content = (
      <CreateActivityPage
        onCreated={() => {
          setToast('活动已发布，正在首页等候新搭子');
          changeTab('activities');
        }}
      />
    );
  } else if (subview === 'create-need') {
    content = (
      <CreateNeedPage
        onBack={() => setSubview(null)}
        onPublished={() => {
          setToast('需求已发布');
          changeTab('needs');
        }}
      />
    );
  } else if (subview === 'create-life') {
    content = (
      <CreateLifePage
        onBack={() => setSubview(null)}
        onPublished={() => {
          setToast('生活动态已发布');
          changeTab('needs');
        }}
      />
    );
  } else if (activeTab === 'explore') content = <ExplorePage onOpenActivity={openClubActivity} onOpenNotifications={openNotifications} />;
  else if (activeTab === 'needs') content = <NeedsPage onOpenNeed={setSelectedNeed} />;
  else if (activeTab === 'profile') content = <ProfilePage onNotice={setToast} onNavigate={profileNavigate} />;
  else content = <ActivitiesHomePage onNeeds={() => changeTab('needs')} onOpenActivity={openClubActivity} onOpenNotifications={openNotifications} />;

  return (
    <AppShell activeTab={activeTab} onTabChange={changeTab} onPublish={openPublish} showBottomNav={!notificationSubview}>
      {content}
      {publishOpen && (
        <PublishTypeSheet
          canPublishActivity={canPublishActivity(user)}
          onSelect={selectPublish}
          onClose={() => setPublishOpen(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}

export default function App() {
  return (
    <QiahaoProvider>
      <NotificationsProvider>
        <ClubProvider>
          <QiahaoApp />
        </ClubProvider>
      </NotificationsProvider>
    </QiahaoProvider>
  );
}
