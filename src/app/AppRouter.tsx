import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
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
  type LoaderFunctionArgs,
} from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import type { AppTab } from '../components/BottomNav';
import { PublishTypeSheet, type PublishKind } from '../components/PublishTypeSheet';
import { Toast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { domainActivityToClub } from '../club/activity-adapter';
import { useClub } from '../club/ClubContext';
import { canPublishActivity, isOperator } from '../domain/roles';
import { reducedFade, snappy } from '../motion/springs';
import styles from './AppRouter.module.css';
import { useNotifications } from '../notifications/NotificationContext';
import type { AppNotification } from '../notifications/types';
import { toLifePost, toNeed, useQiahao } from '../state/QiahaoContext';
import type { ProfileDestination } from '../pages/ProfilePage';
import { api, ApiError } from '../api/client';
import { discoverActivityQueryOptions, type DiscoverActivityFilter } from '../data/activityQueries';
import { queryClient } from '../data/queryClient';
import { activityDetailQueryOptions, activityFeedQueryOptions, contentFeedQueryOptions, lifeDetailQueryOptions, needDetailQueryOptions, profileQueryOptions, sessionQueryOptions } from '../data/serverQueries';
import { notificationQueryOptions } from '../notifications/queries';

const ActivitiesHomePage = lazy(() => import('../pages/ActivitiesHomePage').then((module) => ({ default: module.ActivitiesHomePage })));
const ActivityFeedbackPage = lazy(() => import('../pages/ActivityFeedbackPage').then((module) => ({ default: module.ActivityFeedbackPage })));
const AdminContentPage = lazy(() => import('../pages/AdminContentPage').then((module) => ({ default: module.AdminContentPage })));
const ClubActivityDetailPage = lazy(() => import('../pages/ClubActivityDetailPage').then((module) => ({ default: module.ClubActivityDetailPage })));
const CreateActivityPage = lazy(() => import('../pages/CreateActivityPage').then((module) => ({ default: module.CreateActivityPage })));
const CreateLifePage = lazy(() => import('../pages/CreateLifePage').then((module) => ({ default: module.CreateLifePage })));
const CreateNeedPage = lazy(() => import('../pages/CreateNeedPage').then((module) => ({ default: module.CreateNeedPage })));
const ExplorePage = lazy(() => import('../pages/ExplorePage').then((module) => ({ default: module.ExplorePage })));
const LifePostDetailPage = lazy(() => import('../pages/LifePostDetailPage').then((module) => ({ default: module.LifePostDetailPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const MessagesPage = lazy(() => import('../pages/MessagesPage').then((module) => ({ default: module.MessagesPage })));
const MessageThreadPage = lazy(() => import('../pages/MessagesPage').then((module) => ({ default: module.MessageThreadPage })));
const NeedDetailPage = lazy(() => import('../pages/NeedDetailPage').then((module) => ({ default: module.NeedDetailPage })));
const NeedsPage = lazy(() => import('../pages/NeedsPage').then((module) => ({ default: module.NeedsPage })));
const NotificationCenterPage = lazy(() => import('../pages/NotificationCenterPage').then((module) => ({ default: module.NotificationCenterPage })));
const NotificationDetailPage = lazy(() => import('../pages/NotificationDetailPage').then((module) => ({ default: module.NotificationDetailPage })));
const OnboardingFlow = lazy(() => import('../pages/onboarding/OnboardingFlow').then((module) => ({ default: module.OnboardingFlow })));
const ProfileEditorPage = lazy(() => import('../pages/ProfileEditorPage').then((module) => ({ default: module.ProfileEditorPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const ProfileRecordsPage = lazy(() => import('../pages/ProfileRecordsPage').then((module) => ({ default: module.ProfileRecordsPage })));
const OperatorBusinessConfigPage = lazy(() => import('../pages/OperatorBusinessConfigPage').then((module) => ({ default: module.OperatorBusinessConfigPage })));

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
  if (pathname.startsWith('/profile') || pathname.startsWith('/messages') || pathname.startsWith('/admin') || pathname.startsWith('/operator')) return 'profile';
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
    <main className={styles.appState}>
      <p>{message}</p>
      {action ? <Button type="button" onClick={action.run}>{action.label}</Button> : null}
    </main>
  );
}

export function resolveRootDestination(search: string): string {
  const legacyActivityId = new URLSearchParams(search).get('activity')?.trim();
  return legacyActivityId ? `/activities/${encodeURIComponent(legacyActivityId)}` : '/activities';
}

function RootRedirect() {
  const { search } = useLocation();
  return <Navigate replace to={resolveRootDestination(search)} />;
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
  const reducedMotion = useReducedMotion();

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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className={styles.routeStage}
          key={pathname}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={reducedMotion ? reducedFade : snappy}
        >
          <Outlet context={{ notify: setToast } satisfies ShellContext} />
        </motion.div>
      </AnimatePresence>
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
  const { activities, localMode, user } = useQiahao();
  const { notify } = useShell();
  const detailQuery = useQuery({ ...activityDetailQueryOptions(user?.id ?? 'anonymous', id), enabled: !localMode && Boolean(user) });
  const activity = detailQuery.data?.activity ?? activities.find((item) => item.id === id);
  const clubActivity = activity ? domainActivityToClub(activity) : undefined;
  const focusComments = new URLSearchParams(search).get('comments') === '1';
  if (!clubActivity && detailQuery.isLoading) return <AppState message="正在加载活动详情…" />;
  if (clubActivity) {
    return <ClubActivityDetailPage activity={clubActivity} onBack={() => navigate('/activities')} onNotice={notify} focusComments={focusComments} />;
  }
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
  const { needs, localMode, user } = useQiahao();
  const detailQuery = useQuery({ ...needDetailQueryOptions(user?.id ?? 'anonymous', id), enabled: !localMode && Boolean(user) });
  const detail = detailQuery.data ? toNeed(detailQuery.data.need) : undefined;
  const need = detail ?? needs.find((item) => item.id === id);
  if (!need && detailQuery.isLoading) return <AppState message="正在加载需求详情…" />;
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
  const { lifePosts: serverLifePosts, localMode, user } = useQiahao();
  const detailQuery = useQuery({ ...lifeDetailQueryOptions(user?.id ?? 'anonymous', id), enabled: !localMode && Boolean(user) });
  const detail = detailQuery.data ? toLifePost(detailQuery.data.lifePost) : undefined;
  const post = detail ?? serverLifePosts.find((item) => item.id === id);
  if (!post && detailQuery.isLoading) return <AppState message="正在加载生活动态…" />;
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
    'admin-content': '/admin/content',
    'operator-business': '/operator/business',
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
  const { activities } = useQiahao();
  const domainActivity = activities.find((item) => item.id === id);
  const activity = domainActivity ? domainActivityToClub(domainActivity) : undefined;
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
        notify('预活动已创建，正在首页等待兴趣预约');
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

function OperatorBusinessRoute() {
  const navigate = useNavigate();
  const { user } = useQiahao();
  if (!isOperator(user)) return <AppState message="只有运营者可以管理业务配置" action={{ label: '返回个人页', run: () => navigate('/profile') }} />;
  return <OperatorBusinessConfigPage onBack={() => navigate('/profile')} />;
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

function usesLocalPreviewData(): boolean {
  return import.meta.env.MODE === 'preview'
    || (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom'));
}

async function discoverLoader({ request }: LoaderFunctionArgs) {
  if (usesLocalPreviewData()) return null;
  const url = new URL(request.url);
  const requestedFilter = url.searchParams.get('filter');
  const filter: DiscoverActivityFilter = isDiscoverFilter(requestedFilter) ? requestedFilter : 'all';
  try {
    await queryClient.ensureInfiniteQueryData(discoverActivityQueryOptions(filter, url.searchParams.get('q') ?? ''));
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  return null;
}

function isDiscoverFilter(value: string | null): value is DiscoverActivityFilter {
  return value === 'all' || value === 'pre' || Boolean(value?.startsWith('category:'));
}

async function protectedDataLoader() {
  if (usesLocalPreviewData()) return null;
  try {
    const session = await queryClient.ensureQueryData(sessionQueryOptions());
    await Promise.all([
      queryClient.ensureQueryData(activityFeedQueryOptions(session.user.id)),
      queryClient.ensureQueryData(contentFeedQueryOptions(session.user.id)),
      queryClient.ensureQueryData(profileQueryOptions(session.user.id)),
      queryClient.ensureQueryData(notificationQueryOptions(session.user.id)),
    ]);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  return null;
}

const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginRoute /> },
  { path: '/onboarding', element: <OnboardingRoute /> },
  {
    loader: protectedDataLoader,
    element: <ProtectedAccess />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <ProductShell />,
        children: [
          { path: '/activities', element: <ActivitiesRoute /> },
          { path: '/activities/:id', element: <ActivityRoute /> },
          { path: '/activities/:id/feedback', element: <FeedbackRoute /> },
          { path: '/discover', loader: discoverLoader, element: <ExploreRoute /> },
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
          { path: '/admin/content', element: <OperatorContentRoute /> },
          { path: '/operator/content', element: <Navigate replace to="/admin/content" /> },
          { path: '/operator/business', element: <OperatorBusinessRoute /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate replace to="/" /> },
]);

export function AppRouter() {
  return <Suspense fallback={<AppState message="正在准备页面…" />}><RouterProvider router={router} /></Suspense>;
}
