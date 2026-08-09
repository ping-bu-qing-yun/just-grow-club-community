import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useClub } from '../../club/ClubContext';

const avatarByGender = {
  女: '/assets/avatar-me.jpg',
  男: '/assets/avatar-2.jpg',
  不透露: '/assets/avatar-6.jpg',
} as const;

export function BasicProfileStep({ onNext }: { onNext: () => void }) {
  const { state, saveBasicProfile } = useClub();
  const [profile, setProfile] = useState(state.profile);
  const [avatarCustomized, setAvatarCustomized] = useState(Boolean(state.profile.avatar));
  const [avatarPreview, setAvatarPreview] = useState(state.profile.avatar || '/assets/avatar-me.jpg');

  function update(key: keyof typeof profile, value: string) {
    if (key === 'gender' && !avatarCustomized) {
      const genderAvatar = avatarByGender[value as keyof typeof avatarByGender] ?? '/assets/avatar-me.jpg';
      setAvatarPreview(genderAvatar);
      setProfile((current) => ({ ...current, gender: value, avatar: genderAvatar }));
      return;
    }
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function chooseAvatar(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setAvatarPreview(reader.result);
      setAvatarCustomized(true);
      setProfile((current) => ({ ...current, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="onboarding-body">
      <div className="onboarding-intro">
        <span>基础资料</span>
        <h1>完善一点基础信息</h1>
        <p>先填必要信息，后面可以慢慢补充。</p>
      </div>
      <div className="profile-avatar-edit">
        <img src={avatarPreview} alt="当前头像" />
        <label><Camera size={18} />更换照片<input type="file" accept="image/*" onChange={(event) => chooseAvatar(event.target.files?.[0])} /></label>
      </div>
      <div className="profile-fields">
        <label>昵称<input aria-label="昵称" value={profile.nickname} placeholder="例如 小恰" onChange={(event) => update('nickname', event.target.value)} /></label>
        <label>性别<select value={profile.gender} onChange={(event) => update('gender', event.target.value)}><option value="" disabled>请选择</option><option>女</option><option>男</option><option>不透露</option></select></label>
        <label>生日<input value={profile.birthDate} placeholder="例如 1990.01.26" onChange={(event) => update('birthDate', event.target.value)} /></label>
        <label>身高<input value={profile.height} placeholder="例如 165cm" onChange={(event) => update('height', event.target.value)} /></label>
        <label>居住地<input value={profile.city} placeholder="例如 上海 杨浦区" onChange={(event) => update('city', event.target.value)} /></label>
        <label>家乡<input value={profile.hometown} placeholder="例如 浙江杭州" onChange={(event) => update('hometown', event.target.value)} /></label>
        <label>情感状态<select value={profile.relationship} onChange={(event) => update('relationship', event.target.value)}><option value="" disabled>请选择</option><option>正在寻觅</option><option>单身观察中</option><option>刚结束一段关系</option><option>暂时随缘</option><option>不透露</option></select></label>
        <label>职业<input value={profile.occupation} placeholder="例如 品牌策划" onChange={(event) => update('occupation', event.target.value)} /></label>
      </div>
      <button
        type="button"
        className="primary-button primary-button--wide"
        disabled={!profile.nickname.trim()}
        onClick={() => {
          saveBasicProfile(profile);
          onNext();
        }}
      >
        生成画像
      </button>
    </section>
  );
}
