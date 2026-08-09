import { useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useRouteError,
} from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import type { AppTab } from '../components/BottomNav';
import { PublishTypeSheet, type PublishKind } from '../components/PublishTypeSheet';
import { Toast } from '../components/Toast';
import { clubActivities, lifePosts, seedNeeds } from '../club/seed';
import { useClub } from '../club/ClubContext';
import { canPublishActivity, isOperator } from '../domain/roles';
import { useNotifications } from '../notifications/NotificationContext';
import type { AppNotification } from '../notifications/types';
import { useQiahao } from '../state/QiahaoContext';
import { ActivitiesHomePage } from '../pages/ActivitiesHomePage';
import { ActivityDetail } from '../pages/ActivityDetail';
import { ActivityFeedbackPage } from '../pages/ActivityFeedbackPage';
import { AdminContentPage } from '../pages/AdminContentPage';
import { ClubActivityDetailPage } from '../pages/ClubActivityDetailPage';
import { CreateActivityPage } from '../pages/CreateActivityPage';
import { CreateLifePage } from '../pages/CreateLifePage';
import { CreateNeedPage } from '../pages/CreateNeedPage';
import { ExplorePage } from '../pages/ExplorePage';
import { LifePostDetailPage } from '../pages/LifePostDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { MessageThreadPage, MessagesPage } from '../pages/MessagesPage';
import { NeedDetailPage } from '../pages/NeedDetailPage';
import { NeedsPage } from '../pages/NeedsPage';
import { NotificationCenterPage } from '../pages/NotificationCenterPage';
import { NotificationDetailPage } from '../pages/NotificationDetailPage';
import { OnboardingFlow } from '../pages/onboarding/OnboardingFlow';
import { ProfileEditorPage } from '../pages/ProfileEditorPage';
import { ProfilePage, type ProfileDestination } from '../pages/ProfilePage';
import { ProfileRecordsPage } from '../pages/ProfileRecordsPage';

type ShellContext = {
  notify(message: string): void;
};

const tabPaths: Record<AppTab, string> = {
  activities: '/activities',
  explore: '/discover',
  needs: '/needs',
  profile: '/profile',
};

const tabRoutes = new Set(Object.values(tabPaths));

function safeNext(search: string, fallback = '/activities'): string {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return fallback;
  return next;
}

function activeTabFor(pathname: string): AppTab {
  if (pathname.startsWith('/discover')) return 'explore';
  if (pathname.startsWith('/needs') || pathname.startsWith('/life')) return 'needs';
  if (pathname.startsWith('/profile') || pathname.startsWith('/messages') || pathname.startsWith('/operator')) return 'profile';
  return 'activities';
}

function withCommentFocus(path: string, focusComments = false): string {
  return focusComments ? `${path}?comments=1` : path;
}

function useShell(): ShellContext {
  return useOutletContext<ShellContext>();
}

function AppState({ message, action }: { message: string; action?: { label: string; run(): void } }) {
  return (
    <main className="app-state">
      <p>{message}</p>
      {action ? <button type="button" className="primary-button" onClick={action.run}>{action.label}</button> : null}
    </main>
  );
}

function RootRedirect() {
  const { search } = useLocation();
  const legacyActivityId = new URLSearchParams(search).get('activity')?.trim();
  return <Navigate replace to={legacyActivityId ? `/activities/${encodeURIComponent(legacyActivityId)}` : '/activities'} />;
}

function LoginRoute() {
  const { status, error, retry, login } = useQiahao();
  const { state } = useClub();
  const { search } = useLocation();
  const next = safeNext(search);
  if (status === 'loading') return <AppState message="正在打开恰好…" />;
  if (status === 'error') return <AppState message={error ?? '暂时无法连接服务器'} action={{ label: '重试', run: retry }} />;
  if (status === 'authenticated') {
    return <Navigate replace to={state.onboardingComplete ? next : `/onboarding?next=${encodeURIComponent(next)}`} />;
  }
  return <LoginPage login={login} />;
}

function OnboardingRoute() {
  const { status, error, retry } = useQiahao();
  const { state } = useClub();
  const location = useLocation();
  const navigate = useNavigate();
  const next = safeNext(location.search);
  if (status === 'loading') return <AppState message="正在准备你的画像…" />;
  if (status === 'error') return <AppState message={error ?? '暂时无法连接服务器'} action={{ label: '重试', run: retry }} />;
  if (status === 'anonymous') return <Navigate replace to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} />;
  if (state.onboardingComplete) return <Navigate replace to={next} />;
  return <OnboardingFlow onComplete={() => navigate(next, { replace: true })} />;
}

function ProtectedAccess() {
  const { status, error, retry } = useQiahao();
  const { state } = useClub();
  const location = useLocation();
  const requestedPath = `${location.pathname}${location.search}`;
  if (status === 'loading') return <AppState message="正在打开恰好…" />;
  if (status === 'error') return <AppState message={error ?? '暂时无法连接服务器'} action={{ label: '重试', run: retry }} />;
  if (status === 'anonymous') return <Navigate replace to={`/login?next=${encodeURIComponent(requestedPath)}`} />;
  if (!state.onboardingComplete) return <Navigate replace to={`/onboarding?next=${encodeURIComponent(requestedPath)}`} />;
  return <Outlet />;
}

function ProductShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useQiahao();
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const activeTab = activeTabFor(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  function selectPublish(kind: PublishKind) {
    setPublishOpen(false);
    navigate(`/publish/${kind}`);
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={(tab) => navigate(tabPaths[tab])}
      onPublish={() => setPublishOpen(true)}
      showBottomNav={tabRoutes.has(pathname)}
    >
      <Outlet context={{ notify: setToast } satisfies ShellContext} />
      {publishOpen ? (
        <PublishTypeSheet
          canPublishActivity={canPublishActivity(user)}
          onSelect={selectPublish}
          onClose={() => setPublishOpen(false)}
        />
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </AppShell>
  );
}

function ActivitiesRoute() {
  const navigate = useNavigate();
  return (
    <ActivitiesHomePage
      onNeeds={() => navigate('/needs')}
      onOpenActivity={(activity) => navigate(`/activities/${encodeURIComponent(activity.id)}`)}
      onOpenNotifications={() => navigate('/notifications')}
    />
  );
}

function ExploreRoute() {
  const navigate = useNavigate();
  return (
    <ExplorePage
      onOpenActivity={(activity) => navigate(`/activities/${encodeURIComponent(activity.id)}`)}
      onOpenNotifications={() => navigate('/notifications')}
    />
  );
}

function ActivityRoute() {
  const { id = '' } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const { activities } = useQiahao();
  const { notify } = useShell();
  const clubActivity = clubActivities.find((item) => item.id === id);
  const activity = activities.find((item) => item.id === id);
  const focusComments = new URLSearchParams(search).get('comments') === '1';
  if (clubActivity) {
    return <ClubActivityDetailPage activity={clubActivity} onBack={() => navigate('/activities')} onNotice={notify} focusComments={focusComments} />;
  }
  if (activity) return <ActivityDetail activity={activity} onBack={() => navigate('/activities')} />;
  return <MissingResource label="活动" backTo="/activities" />;
}

function NeedsRoute() {
  const navigate = useNavigate();
  return (
    <NeedsPage
      onOpenNeed={(need, focus) => navigate(withCommentFocus(`/needs/${encodeURIComponent(need.id)}`, focus))}
      onOpenLifePost={(post, focus) => navigate(withCommentFocus(`/life/${encodeURIComponent(post.id)}`, focus))}
    />
  );
}

function NeedRoute() {
  const { id = '' } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const { state } = useClub();
  const { needs } = useQiahao();
  const need = useMemo(
    () => [...needs, ...state.publishedNeeds, ...seedNeeds].find((item) => item.id === id),
    [id, needs, state.publishedNeeds],
  );
  if (!need) return <MissingResource label="需求" backTo="/needs" />;
  return (
    <NeedDetailPage
      need={need}
      onBack={() => navigate('/needs')}
      onOpenActivity={(activity) => navigate(`/activities/${encodeURIComponent(activity.id)}`)}
      focusComments={new URLSearchParams(search).get('comments') === '1'}
    />
  );
}

function LifeRoute() {
  const { id = '' } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const { state } = useClub();
  const { lifePosts: serverLifePosts } = useQiahao();
  const post = useMemo(
    () => [...serverLifePosts, ...state.publishedLifePosts, ...lifePosts].find((item) => item.id === id),
    [id, serverLifePosts, state.publishedLifePosts],
  );
  if (!post) return <MissingResource label="生活动态" backTo="/needs" />;
  return <LifePostDetailPage post={post} onBack={() => navigate('/needs?view=life')} focusComments={new URLSearchParams(search).get('comments') === '1'} />;
}

function ProfileRoute() {
  const navigate = useNavigate();
  const { notify } = useShell();
  const destinations: Record<ProfileDestination, string> = {
    editor: '/profile/edit',
    messages: '/messages',
    'saved-activities': '/profile/records/saved-activities',
    'saved-needs': '/profile/records/saved-needs',
    dynamics: '/needs',
    portrait: '/onboarding?next=%2Fprofile',
    attended: '/profile/records/attended',
    'admin-content': '/operator/content',
  };
  return <ProfilePage onNotice={notify} onNavigate={(destination) => navigate(destinations[destination])} />;
}

function ProfileRecordsRoute() {
  const { kind = '' } = useParams();
  const navigate = useNavigate();
  if (!['saved-activities', 'saved-needs', 'attended'].includes(kind)) return <MissingResource label="记录" backTo="/profile" />;
  return (
    <ProfileRecordsPage
      kind={kind}
      onBack={() => navigate('/profile')}
      onOpenNeed={(need) => navigate(`/needs/${encodeURIComponent(need.id)}`)}
      onOpenClubActivity={(activity) => navigate(`/activities/${encodeURIComponent(activity.id)}`)}
    />
  );
}

function ProfileEditorRoute() {
  const navigate = useNavigate();
  return <ProfileEditorPage onBack={() => navigate('/profile')} />;
}

function MessagesRoute() {
  const navigate = useNavigate();
  return <MessagesPage onOpenThread={(thread) => navigate(`/messages/${encodeURIComponent(thread.id)}`)} />;
}

function MessageRoute() {
  const { threadId = '' } = useParams();
  const navigate = useNavigate();
  const { messages } = useQiahao();
  const thread = messages.find((item) => item.id === threadId);
  if (!thread) return <MissingResource label="消息" backTo="/messages" />;
  return <MessageThreadPage thread={thread} onBack={() => navigate('/messages')} />;
}

function NotificationsRoute() {
  const navigate = useNavigate();
  const { markRead } = useNotifications();
  return (
    <NotificationCenterPage
      onBack={() => navigate('/activities')}
      onOpen={(notification) => {
        markRead(notification.id);
        navigate(`/notifications/${encodeURIComponent(notification.id)}`);
      }}
    />
  );
}

function NotificationRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { notifications, markRead } = useNotifications();
  const { notify } = useShell();
  const notification = notifications.find((item) => item.id === id);

  useEffect(() => {
    if (notification) markRead(notification.id);
  }, [markRead, notification]);

  if (!notification) return <MissingResource label="通知" backTo="/notifications" />;
  return <NotificationDetailPage notification={notification} onBack={() => navigate('/notifications')} onNavigate={(item) => navigateFromNotification(item, navigate, notify)} />;
}

function navigateFromNotification(notification: AppNotification, navigate: ReturnType<typeof useNavigate>, notify: (message: string) => void) {
  const target = notification.target;
  if (target?.type === 'activity' && target.id) {
    navigate(notification.category === 'feedback' ? `/activities/${encodeURIComponent(target.id)}/feedback` : `/activities/${encodeURIComponent(target.id)}`);
    return;
  }
  if (target?.type === 'need' && target.id) {
    navigate(`/needs/${encodeURIComponent(target.id)}`);
    return;
  }
  if (target?.type === 'messages') {
    navigate(target.id ? `/messages/${encodeURIComponent(target.id)}` : '/messages');
    return;
  }
  notify('相关内容暂时无法打开');
}

function FeedbackRoute() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { notify } = useShell();
  const activity = clubActivities.find((item) => item.id === id);
  if (!activity) return <MissingResource label="活动反馈" backTo="/activities" />;
  return (
    <ActivityFeedbackPage
      activity={activity}
      onBack={() => navigate(`/activities/${encodeURIComponent(id)}`)}
      onSubmitted={() => {
        notify('反馈已提交，谢谢你认真说感受');
        navigate(`/activities/${encodeURIComponent(id)}`);
      }}
    />
  );
}

function CreateActivityRoute() {
  const navigate = useNavigate();
  const { user } = useQiahao();
  const { notify } = useShell();
  if (!isOperator(user)) return <AppState message="只有运营者可以发布活动" action={{ label: '返回活动', run: () => navigate('/activities') }} />;
  return (
    <CreateActivityPage
      onBack={() => navigate('/activities')}
      onCreated={(activity) => {
        notify('活动已发布，正在首页等候新搭子');
        navigate(`/activities/${encodeURIComponent(activity.id)}`);
      }}
    />
  );
}

function CreateNeedRoute() {
  const navigate = useNavigate();
  const { notify } = useShell();
  return <CreateNeedPage onBack={() => navigate('/needs')} onPublished={() => { notify('需求已发布'); navigate('/needs'); }} />;
}

function CreateLifeRoute() {
  const navigate = useNavigate();
  const { notify } = useShell();
  return <CreateLifePage onBack={() => navigate('/needs?view=life')} onPublished={() => { notify('生活动态已发布'); navigate('/needs?view=life'); }} />;
}

function OperatorContentRoute() {
  const navigate = useNavigate();
  return <AdminContentPage onBack={() => navigate('/profile')} />;
}

function MissingResource({ label, backTo }: { label: string; backTo: string }) {
  const navigate = useNavigate();
  return <AppState message={`${label}不存在或已不可见`} action={{ label: '返回', run: () => navigate(backTo) }} />;
}

function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : '页面暂时无法打开';
  return <AppState message={message} action={{ label: '返回首页', run: () => window.location.assign('/activities') }} />;
}

const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginRoute /> },
  { path: '/onboarding', element: <OnboardingRoute /> },
  {
    element: <ProtectedAccess />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <ProductShell />,
        children: [
          { path: '/activities', element: <ActivitiesRoute /> },
          { path: '/activities/:id', element: <ActivityRoute /> },
          { path: '/activities/:id/feedback', element: <FeedbackRoute /> },
          { path: '/discover', element: <ExploreRoute /> },
          { path: '/needs', element: <NeedsRoute /> },
          { path: '/needs/:id', element: <NeedRoute /> },
          { path: '/life/:id', element: <LifeRoute /> },
          { path: '/profile', element: <ProfileRoute /> },
          { path: '/profile/edit', element: <ProfileEditorRoute /> },
          { path: '/profile/records/:kind', element: <ProfileRecordsRoute /> },
          { path: '/messages', element: <MessagesRoute /> },
          { path: '/messages/:threadId', element: <MessageRoute /> },
          { path: '/notifications', element: <NotificationsRoute /> },
          { path: '/notifications/:id', element: <NotificationRoute /> },
          { path: '/publish/activity', element: <CreateActivityRoute /> },
          { path: '/publish/need', element: <CreateNeedRoute /> },
          { path: '/publish/life', element: <CreateLifeRoute /> },
          { path: '/operator/content', element: <OperatorContentRoute /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate replace to="/" /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
