import { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import type { BasicProfile } from '../club/types';
import { useClub } from '../club/ClubContext';

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

  function set(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="profile-editor page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>我的资料</small><h1>让别人慢慢了解你</h1></div>
      </header>
      <div className="editor-score"><b>资料完成度</b><i><em /></i><span>80</span></div>
      <section className="editor-cover">
        <img src="/assets/avatar-me.jpg" alt="" />
        <button type="button"><Camera size={17} />更换头像</button>
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
        <div className="club-tags">{profile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <h2>我的见面偏好</h2>
        <div className="club-tags">{profile.preferences.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </section>
      <button
        type="button"
        className="primary-button primary-button--wide"
        onClick={() => {
          saveBasicProfile(profile);
          onBack();
        }}
      >
        保存资料
      </button>
    </main>
  );
}
