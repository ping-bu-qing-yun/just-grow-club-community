import { useState } from 'react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useQiahao } from '../state/QiahaoContext';
import { Button } from '../components/ui/Button';
import styles from './CreateNeedPage.module.css';

const lifeTemplates = [
  '周末想找人一起去梧桐区散步，先轻松认识，不急着定义关系。',
  '今天在咖啡店待了一下午，忽然觉得一个人也很好，但有人能聊聊更好。',
  '想问问大家：你们觉得舒服的关系，是从心动开始，还是从不费力开始？',
];
const photoOptions = ['/assets/coffee.jpg', '/assets/hike.jpg', '/assets/art.jpg', '/assets/food.jpg'];
const tagOptions = [
  { label: '周末的一百种过法', ref: 'weekend' },
  { label: '关系里的松弛感', ref: 'relationship' },
];

export function CreateLifePage({ onBack, onPublished }: { onBack: () => void; onPublished: () => void }) {
  const { createLifePost, localMode } = useQiahao();
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(photoOptions[0]);
  const [tags, setTags] = useState<string[]>(['weekend']);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!text.trim()) {
      setError('先写下一句话');
      return;
    }
    setPending(true);
    setError('');
    try {
      await createLifePost(text.trim(), selectedImage, tags);
      onPublished();
    } catch (reason) {
      // 本地预览写入内存状态后即视为成功。
      if (localMode) {
        onPublished();
      } else {
        setError(reason instanceof Error ? reason.message : '发布失败');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={`${styles.page} page`}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>发布生活</small><h1>分享此刻的日常</h1></div>
      </header>
      <p className={styles.lead}>不用很正式，像给朋友发一条近况就好。</p>
      <div className={styles.guideChips}>{lifeTemplates.map((template) => <button type="button" onClick={() => { setText(template); setError(''); }} key={template}>{template}</button>)}</div>
      <textarea className={styles.textarea} aria-label="生活内容" value={text} onChange={(event) => { setText(event.target.value); setError(''); }} placeholder="比如：周末想找人一起去梧桐区散步……" />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.photoGrid} aria-label="选择生活照片">
        {photoOptions.map((image) => (
          <button
            type="button"
            className={selectedImage === image ? styles.active : ''}
            onClick={() => setSelectedImage(image)}
            key={image}
          >
            <img src={image} alt="" />
          </button>
        ))}
      </div>
      <div className={styles.tools}>
        <button type="button" onClick={() => setSelectedImage(photoOptions[(photoOptions.indexOf(selectedImage) + 1) % photoOptions.length])}><ImagePlus size={18} />换一张图</button>
      </div>
      <small className={styles.helper}>照片和标签会直接出现在生活动态卡片里。</small>
      <div className={styles.tagPicks}>
        {tagOptions.map((tag) => (
          <button
            type="button"
            className={tags.includes(tag.ref) ? styles.active : ''}
            onClick={() => setTags((current) => current.includes(tag.ref) ? current.filter((item) => item !== tag.ref) : [...current, tag.ref])}
            key={tag.ref}
          >
            #{tag.label}
          </button>
        ))}
      </div>
      <Button wide onClick={() => void submit()} disabled={pending}>{pending ? '发布中…' : '确认发布'}</Button>
    </main>
  );
}
