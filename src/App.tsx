import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from './components/AppShell';
import type { AppTab } from './components/BottomNav';
import { PublishTypeSheet, type PublishKind } from './components/PublishTypeSheet';
import type { ClubActivity, LifePost, Need } from './club/types';
import type { Activity, MessageThread } from './domain/types';
import { ClubProvider, useClub } from './club/ClubContext';
import { QiahaoProvider, useQiahao } from './state/QiahaoContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingFlow } from './pages/onboarding/OnboardingFlow';
import { ActivitiesHomePage } from './pages/ActivitiesHomePage';
import { ExplorePage } from './pages/ExplorePage';
import { NeedsPage, type NeedsMode } from './pages/NeedsPage';
import { NeedDetailPage } from './pages/NeedDetailPage';
import { LifePostDetailPage } from './pages/LifePostDetailPage';
import { ClubActivityDetailPage } from './pages/ClubActivityDetailPage';
import { ProfilePage, type ProfileDestination } from './pages/ProfilePage';
import { ProfileEditorPage } from './pages/ProfileEditorPage';
import { ProfilePortraitPage } from './pages/ProfilePortraitPage';
import { ProfileServicePage, type ProfileServiceKind } from './pages/ProfileServicePage';
import { ProfileRecordsPage } from './pages/ProfileRecordsPage';
import { CreateActivityPage } from './pages/CreateActivityPage';
import { CreateNeedPage } from './pages/CreateNeedPage';
import { CreateLifePage } from './pages/CreateLifePage';
import { MessagesPage, MessageThreadPage } from './pages/MessagesPage';
import { SavedPage } from './pages/SavedPage';
import { ActivityFeedbackPage } from './pages/ActivityFeedbackPage';
import { Toast } from './components/Toast';
import { canPublishActivity } from './domain/roles';
import { NotificationsProvider, useNotifications } from './notifications/NotificationContext';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { NotificationDetailPage } from './pages/NotificationDetailPage';
import { AdminContentPage } from './pages/AdminContentPage';
import type { AppNotification } from './notifications/types';
import { clubActivities, seedNeeds } from './club/seed';
import { getClubActivityById, readActivityIdFromLocation, writeActivityIdToLocation } from './lib/activityShare';

function activityToClubActivity(activity: Activity): ClubActivity {
  return {
    id: activity.id,
    theme: 'other',
    status: '成熟活动',
    title: activity.title,
    tags: ['由你发起', activity.category],
    description: activity.description,
    image: activity.image,
    date: `${activity.dateLabel} · ${activity.time}`,
    location: activity.location,
    people: `${activity.capacity}人`,
    fee: activity.price === 0 ? '免费' : `¥${activity.price}`,
    needs: [activity.category, '自然认识', '低压力见面'],
    timeRange: `${activity.dateLabel} ${activity.time}`,
    audience: '由发起人邀请，适合同频、低压力参与的人',
    flow: [
      { title: '集合确认', body: '活动开始前确认集合信息、人数和边界。' },
      { title: '轻松认识', body: '围绕活动主题自然交流，不做强制配对。' },
      { title: '活动收束', body: '结束后可以在恰好留下反馈，帮助后续推荐更准确。' },
    ],
    boundary: activity.note ?? '不强制交换联系方式，不舒服时可以随时退出。',
    pitch: activity.description,
    matchLabel: '新发布',
  };
}

function QiahaoApp() {
  const { status, error, retry, login, logout, user } = useQiahao();
  const { state, resetOnboarding } = useClub();
  const { markRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<AppTab>('activities');
  const [subview, setSubview] = useState<string | null>(null);
  const [needsMode, setNeedsMode] = useState<NeedsMode>('needs');
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [needFocusComments, setNeedFocusComments] = useState(false);
  const [selectedLifePost, setSelectedLifePost] = useState<LifePost | null>(null);
  const [lifeFocusComments, setLifeFocusComments] = useState(false);
  const [createdClubActivities, setCreatedClubActivities] = useState<ClubActivity[]>([]);
  const [selectedClubActivity, setSelectedClubActivity] = useState<ClubActivity | null>(() =>
    getClubActivityById(readActivityIdFromLocation()),
  );
  const [activityFocusComments, setActivityFocusComments] = useState(false);
  const [feedbackActivity, setFeedbackActivity] = useState<ClubActivity | null>(null);
  const [selectedMessageThread, setSelectedMessageThread] = useState<MessageThread | null>(null);
  const [notificationSubview, setNotificationSubview] = useState<'center' | 'detail' | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deepLinkReady, setDeepLinkReady] = useState(false);
  const [forceRegistration, setForceRegistration] = useState(false);
  const [needsReturnToProfile, setNeedsReturnToProfile] = useState(false);
  const returnScrollRef = useRef(0);
  const allClubActivities = useMemo(
    () => [
      ...createdClubActivities,
      ...clubActivities.filter((item) => !createdClubActivities.some((created) => created.id === item.id)),
    ],
    [createdClubActivities],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !state.onboardingComplete || deepLinkReady) return;
    const activity = getClubActivityById(readActivityIdFromLocation());
    if (activity) {
      setSelectedNeed(null);
      setNeedFocusComments(false);
      setSelectedLifePost(null);
      setLifeFocusComments(false);
      setFeedbackActivity(null);
      setNotificationSubview(null);
      setSelectedNotification(null);
      setSelectedClubActivity(activity);
      setActivityFocusComments(false);
      writeActivityIdToLocation(activity.id);
    }
    setDeepLinkReady(true);
  }, [status, state.onboardingComplete, deepLinkReady]);

  useEffect(() => {
    if (status !== 'authenticated' || !forceRegistration) return;
    resetOnboarding();
    setForceRegistration(false);
    setActiveTab('activities');
    setSubview(null);
    window.scrollTo({ top: 0 });
  }, [forceRegistration, resetOnboarding, status]);

  async function startRegistration(phone: string, password: string) {
    setForceRegistration(true);
    await login(phone, password);
  }

  if (status === 'anonymous') return <LoginPage login={startRegistration} />;
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
    return (
      <OnboardingFlow
        onBackStart={() => void logout()}
        onComplete={() => {
          setActiveTab('activities');
          setSubview(null);
        }}
      />
    );
  }

  function changeTab(tab: AppTab) {
    setActiveTab(tab);
    setSubview(null);
    setSelectedNeed(null);
    setNeedFocusComments(false);
    setSelectedLifePost(null);
    setLifeFocusComments(false);
    setSelectedClubActivity(null);
    setActivityFocusComments(false);
    setFeedbackActivity(null);
    setSelectedMessageThread(null);
    setNotificationSubview(null);
    setSelectedNotification(null);
    setPublishOpen(false);
    setNeedsReturnToProfile(false);
    writeActivityIdToLocation(null);
    window.scrollTo({ top: 0 });
  }

  function profileNavigate(destination: ProfileDestination) {
    if (destination === 'dynamics') {
      setNeedsMode('life');
      setActiveTab('needs');
      setSubview(null);
      setNeedsReturnToProfile(true);
      window.scrollTo({ top: 0 });
      return;
    }
    setSubview(destination);
    setSelectedMessageThread(null);
    window.scrollTo({ top: 0 });
  }

  function openPublish() {
    setPublishOpen(true);
  }

  function selectPublish(kind: PublishKind) {
    setPublishOpen(false);
    setSelectedNeed(null);
    setNeedFocusComments(false);
    setSelectedClubActivity(null);
    setActivityFocusComments(false);
    setSelectedLifePost(null);
    setLifeFocusComments(false);
    setSelectedMessageThread(null);
    writeActivityIdToLocation(null);
    if (kind === 'activity') setSubview('create-activity');
    if (kind === 'need') setSubview('create-need');
    if (kind === 'life') setSubview('create-life');
    window.scrollTo({ top: 0 });
  }

  function openClubActivity(activity: ClubActivity, focusComments = false) {
    returnScrollRef.current = window.scrollY;
    setSelectedNeed(null);
    setNeedFocusComments(false);
    setSelectedLifePost(null);
    setLifeFocusComments(false);
    setFeedbackActivity(null);
    setSelectedClubActivity(activity);
    setActivityFocusComments(focusComments);
    setPublishOpen(false);
    writeActivityIdToLocation(activity.id);
    window.scrollTo({ top: 0 });
  }

  function closeClubActivity() {
    setSelectedClubActivity(null);
    setActivityFocusComments(false);
    writeActivityIdToLocation(null);
    requestAnimationFrame(() => window.scrollTo({ top: returnScrollRef.current }));
  }

  function openNeed(need: Need, focusComments = false) {
    returnScrollRef.current = window.scrollY;
    setSelectedLifePost(null);
    setLifeFocusComments(false);
    setSelectedClubActivity(null);
    setActivityFocusComments(false);
    setFeedbackActivity(null);
    setNeedFocusComments(focusComments);
    setSelectedNeed(need);
    setSubview(null);
    writeActivityIdToLocation(null);
    window.scrollTo({ top: 0 });
  }

  function openLifePost(post: LifePost, focusComments = false) {
    returnScrollRef.current = window.scrollY;
    setSelectedNeed(null);
    setNeedFocusComments(false);
    setSelectedClubActivity(null);
    setActivityFocusComments(false);
    setFeedbackActivity(null);
    setLifeFocusComments(focusComments);
    setSelectedLifePost(post);
    setSubview(null);
    writeActivityIdToLocation(null);
    window.scrollTo({ top: 0 });
  }

  function openActivityFeedback(activity: ClubActivity) {
    setSelectedNeed(null);
    setNeedFocusComments(false);
    setSelectedClubActivity(null);
    setSelectedLifePost(null);
    setLifeFocusComments(false);
    setFeedbackActivity(activity);
    setSubview(null);
    setSelectedMessageThread(null);
    setNotificationSubview(null);
    setSelectedNotification(null);
    setPublishOpen(false);
    writeActivityIdToLocation(null);
    window.scrollTo({ top: 0 });
  }

  function openNotifications() {
    setSelectedNeed(null);
    setNeedFocusComments(false);
    setSelectedLifePost(null);
    setLifeFocusComments(false);
    setSelectedClubActivity(null);
    setFeedbackActivity(null);
    setSubview(null);
    setSelectedMessageThread(null);
    setNotificationSubview('center');
    setSelectedNotification(null);
    writeActivityIdToLocation(null);
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
      const activity = allClubActivities.find((item) => item.id === notification.target?.id);
      if (!activity) {
        setToast('相关活动暂时无法打开');
        return;
      }
      if (notification.category === 'feedback') return openActivityFeedback(activity);
      return openClubActivity(activity);
    }
    if (notification.target?.type === 'need') {
      const need = [...state.publishedNeeds, ...seedNeeds].find((item) => item.id === notification.target?.id);
      if (need) return openNeed(need);
      setToast('相关需求暂时无法打开');
      return;
    }
    if (notification.target?.type === 'messages') setSubview('messages');
  }

  let content;
  if (notificationSubview === 'center') content = <NotificationCenterPage onBack={() => setNotificationSubview(null)} onOpen={openNotification} />;
  else if (notificationSubview === 'detail' && selectedNotification) content = <NotificationDetailPage notification={selectedNotification} onBack={() => setNotificationSubview('center')} onNavigate={navigateFromNotification} />;
  else if (feedbackActivity) {
    content = (
      <ActivityFeedbackPage
        activity={feedbackActivity}
        onBack={() => setFeedbackActivity(null)}
        onSubmitted={() => {
          setFeedbackActivity(null);
          setToast('反馈已提交，谢谢你认真说感受');
        }}
      />
    );
  }
  else if (selectedNeed) {
    content = (
      <NeedDetailPage
        need={selectedNeed}
        onBack={() => {
          setSelectedNeed(null);
          requestAnimationFrame(() => window.scrollTo({ top: returnScrollRef.current }));
        }}
        onOpenActivity={openClubActivity}
        focusComments={needFocusComments}
      />
    );
  }
  else if (selectedLifePost) {
    content = (
      <LifePostDetailPage
        post={selectedLifePost}
        onBack={() => {
          setSelectedLifePost(null);
          requestAnimationFrame(() => window.scrollTo({ top: returnScrollRef.current }));
        }}
        onNotice={setToast}
        focusComments={lifeFocusComments}
      />
    );
  }
  else if (selectedClubActivity) {
    content = (
      <ClubActivityDetailPage
        activity={selectedClubActivity}
        onBack={closeClubActivity}
        onNotice={setToast}
        focusComments={activityFocusComments}
        canEdit={selectedClubActivity.matchLabel === '新发布'}
        onUpdate={(activity) => {
          setCreatedClubActivities((current) => [activity, ...current.filter((item) => item.id !== activity.id)]);
          setSelectedClubActivity(activity);
        }}
      />
    );
  } else if (subview === 'editor') content = <ProfileEditorPage onBack={() => setSubview(null)} />;
  else if (subview === 'portrait') content = <ProfilePortraitPage onBack={() => setSubview(null)} />;
  else if (subview === 'help' || subview === 'safety' || subview === 'settings') content = <ProfileServicePage kind={subview as ProfileServiceKind} onBack={() => setSubview(null)} />;
  else if (selectedMessageThread) content = <MessageThreadPage thread={selectedMessageThread} onBack={() => setSelectedMessageThread(null)} />;
  else if (subview === 'messages') content = <MessagesPage onOpenThread={setSelectedMessageThread} />;
  else if (subview === 'saved-activities') {
    content = (
      <SavedPage
        onExplore={() => changeTab('explore')}
        onOpenActivity={(id) => {
          const club = allClubActivities.find((item) => item.id === id);
          if (club) return openClubActivity(club);
          setToast('该活动详情暂不可用');
        }}
        onOpenClubActivity={openClubActivity}
        clubActivityOptions={allClubActivities}
        onBack={() => setSubview(null)}
      />
    );
  } else if (subview === 'saved-needs' || subview === 'attended') {
    content = (
      <ProfileRecordsPage
        kind={subview}
        onBack={() => setSubview(null)}
        onOpenNeed={(need) => {
          setSubview(null);
          openNeed(need);
          window.scrollTo({ top: 0 });
        }}
        onOpenClubActivity={openClubActivity}
        clubActivityOptions={allClubActivities}
      />
    );
  } else if (subview === 'admin-content') {
    content = (
      <AdminContentPage
        onBack={() => setSubview(null)}
        onGenerateActivity={(activity) => {
          setCreatedClubActivities((current) => [activity, ...current.filter((item) => item.id !== activity.id)]);
          setToast('预活动已生成，用户端活动列表可见');
        }}
      />
    );
  } else if (subview === 'create-activity') {
    content = (
      <CreateActivityPage
        onBack={() => setSubview(null)}
        onCreated={(activity) => {
          const clubActivity = activityToClubActivity(activity);
          setCreatedClubActivities((current) => [clubActivity, ...current.filter((item) => item.id !== clubActivity.id)]);
          setToast('活动已发布，正在首页等候新搭子');
          setSubview(null);
          setActiveTab('activities');
          openClubActivity(clubActivity);
        }}
      />
    );
  } else if (subview === 'create-need') {
    content = (
      <CreateNeedPage
        onBack={() => setSubview(null)}
        onPublished={() => {
          setToast('需求已发布');
          setNeedsMode('needs');
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
          setNeedsMode('life');
          changeTab('needs');
        }}
      />
    );
  } else if (activeTab === 'explore') content = <ExplorePage activities={allClubActivities} onOpenActivity={openClubActivity} onOpenNotifications={openNotifications} />;
  else if (activeTab === 'needs') content = <NeedsPage mode={needsMode} onModeChange={setNeedsMode} onOpenNeed={openNeed} onOpenLifePost={openLifePost} onNotice={setToast} onBack={needsReturnToProfile ? () => changeTab('profile') : undefined} />;
  else if (activeTab === 'profile') content = <ProfilePage onNotice={setToast} onNavigate={profileNavigate} />;
  else content = <ActivitiesHomePage activities={allClubActivities} onOpenNeed={openNeed} onOpenActivity={openClubActivity} onOpenNotifications={openNotifications} />;

  return (
    <AppShell activeTab={activeTab} onTabChange={changeTab} onPublish={openPublish}>
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
