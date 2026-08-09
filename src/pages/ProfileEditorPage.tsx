import { useMemo, useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import type { BasicProfile } from '../club/types';
import { useClub } from '../club/ClubContext';
import { buildUserPortrait } from '../club/portrait';

const profileFields: Array<[keyof BasicProfile, string]> = [
  ['nickname', '昵称'],
  ['gender', '性别'],
  ['birthDate', '生日'],
  ['height', '身高'],
  ['city', '居住地'],
  ['hometown', '家乡'],
  ['relationship', '情感状态'],
  ['occupation', '职业'],
];

export function ProfileEditorPage({ onBack }: { onBack: () => void }) {
  const { state, saveBasicProfile } = useClub();
  const [profile, setProfile] = useState(state.profile);
  const [avatarPreview, setAvatarPreview] = useState(state.profile.avatar || '/assets/avatar-me.jpg');
  const portrait = useMemo(() => buildUserPortrait(state), [state]);
  const derivedTags = useMemo(
    () => (profile.tags.length ? profile.tags : portrait.highlightTags).slice(0, 6),
    [profile.tags, portrait.highlightTags],
  );
  const derivedPreferences = useMemo(() => {
    const fromProfile = profile.preferences.filter(Boolean);
    if (fromProfile.length) return fromProfile.slice(0, 6);
    const fromPortrait = [...portrait.scenes, ...portrait.barriers, ...portrait.intents]
      .filter((tag, index, all) => all.indexOf(tag) === index);
    return (fromPortrait.length ? fromPortrait : ['少人数见面', '低压力开场', '先轻松认识']).slice(0, 6);
  }, [portrait.barriers, portrait.intents, portrait.scenes, profile.preferences]);

  function set(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function chooseAvatar(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setAvatarPreview(reader.result);
      setProfile((current) => ({ ...current, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="profile-editor page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>我的资料</small><h1>让别人慢慢了解你</h1></div>
      </header>
      <div className="editor-score"><b>资料完成度</b><i><em /></i><span>80</span></div>
      <section className="editor-cover">
        <img src={avatarPreview} alt="" />
        <label><Camera size={17} />更换头像<input type="file" accept="image/*" onChange={(event) => chooseAvatar(event.target.files?.[0])} /></label>
        <h2>{profile.nickname}</h2>
        <p>先立体认识自己，再让别人慢慢了解你。</p>
      </section>
      <section className="editor-fields">
        <h2>基础资料</h2>
        {profileFields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input value={String(profile[key])} onChange={(event) => set(key, event.target.value)} />
          </label>
        ))}
      </section>
      <section className="editor-copy">
        <h2>关于我</h2>
        <textarea value={profile.bio} onChange={(event) => set('bio', event.target.value)} />
        <h2>我的标签</h2>
        <p className="editor-copy-hint">来自注册问答与画像整理。</p>
        <div className="club-tags">{derivedTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <h2>我的见面偏好</h2>
        <p className="editor-copy-hint">系统会用这些偏好优化推荐活动。</p>
        <div className="club-tags">{derivedPreferences.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </section>
      <button
        type="button"
        className="primary-button primary-button--wide"
        onClick={() => {
          saveBasicProfile({
            ...profile,
            tags: profile.tags.length ? profile.tags : derivedTags,
            preferences: profile.preferences.length ? profile.preferences : derivedPreferences,
          });
          onBack();
        }}
      >
        保存资料
      </button>
    </main>
  );
}
