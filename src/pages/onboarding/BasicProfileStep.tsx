import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useQiahao } from '../../state/QiahaoContext';
import shared from './Onboarding.module.css';
import styles from './BasicProfileStep.module.css';

const previewOptions = [
  ['gender', '女', '女'], ['gender', '男', '男'], ['gender', '不透露', '不透露'],
  ['education', '本科', '本科'], ['education', '硕士', '硕士'], ['education', '博士', '博士'],
].map(([groupKey, label, value], sortOrder) => ({ groupKey, key: value, label, value, enabled: true, sortOrder, updatedAt: '' }));

export function BasicProfileStep({ onNext }: { onNext: () => void }) {
  const { state, saveBasicProfile } = useClub();
  const { businessConfig, localMode } = useQiahao();
  const [profile, setProfile] = useState(state.profile);
  const options = businessConfig?.profileOptions ?? (localMode ? previewOptions : []);
  const forGroup = (group: string) => options.filter((option) => option.groupKey === group);

  function update(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className={shared.body}>
      <div className={shared.intro}>
        <span>基础资料</span>
        <h1>完善一点基础信息</h1>
        <p>先填最少的部分，后面可以慢慢补充。</p>
      </div>
      <div className={styles.avatarEdit}>
        <Avatar src="/assets/avatar-me.jpg" name={profile.nickname} size={80} />
        <button type="button" className={styles.changePhoto}>
          <Camera size={18} />更换照片
        </button>
      </div>
      <div className={styles.fields}>
        <Input label="昵称" aria-label="昵称" value={profile.nickname} onChange={(event) => update('nickname', event.target.value)} />
        <Input label="生年月日" type="date" value={profile.birthDate} onChange={(event) => update('birthDate', event.target.value)} />
        <Select label="性别" value={profile.gender} onChange={(event) => update('gender', event.target.value)}>
          <option value="">请选择</option>
          {forGroup('gender').map((option) => (
            <option key={option.key} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Select label="学历" value={profile.education} onChange={(event) => update('education', event.target.value)}>
          <option value="">请选择</option>
          {forGroup('education').map((option) => (
            <option key={option.key} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Input label="职业" value={profile.occupation} onChange={(event) => update('occupation', event.target.value)} />
      </div>
      <Button wide disabled={!profile.nickname.trim()} onClick={() => { saveBasicProfile(profile); onNext(); }} className={styles.submit}>
        生成画像
      </Button>
    </section>
  );
}
