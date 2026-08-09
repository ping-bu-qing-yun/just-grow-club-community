import { ArrowLeft, Archive, Bookmark, Heart, Pencil, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ClubActivity, Need } from '../club/types';
import { useQiahao } from '../state/QiahaoContext';
import { CommentSection } from '../components/CommentSection';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { domainActivityToClub } from '../club/activity-adapter';
import styles from './NeedDetailPage.module.css';

export function NeedDetailPage({
  need,
  onBack,
  onOpenActivity,
  focusComments = false,
}: {
  need: Need;
  onBack: () => void;
  onOpenActivity?: (activity: ClubActivity) => void;
  focusComments?: boolean;
}) {
  const { activities, user, updateNeed, archiveNeed, toggleContentSaved, toggleContentResonance } = useQiahao();
  const saved = Boolean(need.saved);
  const resonated = Boolean(need.resonated);

  const resonanceCount = need.resonance;
  const [commentCount, setCommentCount] = useState(need.comments);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(need.copy);
  const [tags, setTags] = useState(need.tags.join('，'));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const canManage = user?.role === 'operator' || Boolean(user && need.authorId === user.id);
  const hasResponse = Boolean(need.responseActivityId);
  const responseCount = hasResponse ? 1 : 0;
  const responseActivity = hasResponse
    ? activities.find((item) => item.id === need.responseActivityId)
    : undefined;
  const statsEmpty = resonanceCount === 0 && commentCount === 0 && responseCount === 0;

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`need-${need.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [focusComments, need.id]);

  function handleViewActivity() {
    if (!responseActivity || !onOpenActivity) return;
    onOpenActivity(domainActivityToClub(responseActivity));
  }

  async function saveChanges() {
    setPending(true);
    setError('');
    try {
      await updateNeed(need.id, body, tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean));
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '需求保存失败');
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    setError('');
    try {
      await archiveNeed(need.id);
      onBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '需求归档失败');
      setPending(false);
    }
  }

  return (
    <main className={`${styles.detail} page`}>
      <div className={styles.media}>
        <img src={need.image} alt="" />
        <button type="button" className={styles.backButton} aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
      </div>
      <div className={styles.content}>
        <small className={styles.byline}>
          {need.author} · {need.subtitle}
        </small>
        {canManage ? (
          <div className={styles.ownerActions}>
            <Button variant="secondary" size="sm" icon={<Pencil size={15} />} onClick={() => setEditing((value) => !value)}>
              {editing ? '取消编辑' : '编辑'}
            </Button>
            <Button variant="secondary" size="sm" icon={<Archive size={15} />} disabled={pending} onClick={() => void archive()}>
              归档
            </Button>
          </div>
        ) : null}
        {editing ? (
          <section className={styles.inlineEditor}>
            <Textarea label="需求内容" value={body} onChange={(event) => setBody(event.target.value)} rows={6} />
            <Input label="标签（逗号分隔）" value={tags} onChange={(event) => setTags(event.target.value)} />
            <Button icon={<Save size={15} />} disabled={pending || !body.trim()} onClick={() => void saveChanges()}>
              {pending ? '保存中…' : '保存修改'}
            </Button>
          </section>
        ) : (
          <>
            <h1 className={styles.title}>{need.title}</h1>
            <p className={styles.copy}>{need.copy}</p>
          </>
        )}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.tags}>
          {need.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        <section className={`${styles.response} ${statsEmpty ? styles.responseEmpty : ''}`}>
          <header>
            <h2>这张需求正在发生什么</h2>
            <span className={hasResponse ? styles.responseActive : styles.responseWaiting}>
              {hasResponse ? '有人接住' : '还在等回应'}
            </span>
          </header>
          <div className={styles.stats} aria-label="需求互动数据">
            <b className={resonanceCount === 0 ? styles.zero : undefined}>
              {resonanceCount}
              <small>人共鸣</small>
            </b>
            <b className={commentCount === 0 ? styles.zero : undefined}>
              {commentCount}
              <small>条评论</small>
            </b>
            <b className={responseCount === 0 ? styles.zero : undefined}>
              {responseCount}
              <small>场回应</small>
            </b>
          </div>
          {hasResponse ? (
            <div className={styles.responseLink}>
              <span>有活动回应了 · {need.response}</span>
              <button type="button" onClick={handleViewActivity} disabled={!responseActivity}>
                查看
              </button>
            </div>
          ) : (
            <div className={styles.emptyInline} aria-disabled="true">
              <strong>还没有活动回应</strong>
              <span>收藏这张需求，之后有合适的活动，我们会通知你</span>
            </div>
          )}
        </section>

        <CommentSection
          contentType="need"
          contentId={need.id}
          title="大家怎么说"
          onCountChange={setCommentCount}
        />

        <div className={styles.actions}>
          <Button
            variant={resonated ? 'primary' : 'secondary'}
            wide
            icon={<Heart size={18} />}
            onClick={() => toggleContentResonance('need', need.id)}
          >
            {resonated ? '已共鸣' : '我也有'}
          </Button>
          <Button
            variant={saved ? 'primary' : 'secondary'}
            wide
            icon={<Bookmark size={18} />}
            onClick={() => toggleContentSaved('need', need.id)}
          >
            {saved ? '已收藏' : '收藏'}
          </Button>
        </div>
      </div>
    </main>
  );
}
