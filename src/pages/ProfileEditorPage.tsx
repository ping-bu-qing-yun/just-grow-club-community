import { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { useClub } from '../club/ClubContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { useQiahao } from '../state/QiahaoContext';
import styles from './ProfileEditorPage.module.css';

export function ProfileEditorPage({ onBack }: { onBack: () => void }) {
  const { state, saveBasicProfile } = useClub();
  const { businessConfig, localMode, saveProfileRecord } = useQiahao();
  const [profile, setProfile] = useState(state.profile);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const previewOptions = [
    ['gender', '女', '女'], ['gender', '男', '男'], ['gender', '不透露', '不透露'],
    ['education', '本科', '本科'], ['education', '硕士', '硕士'], ['education', '博士', '博士'],
    ['relationship', '单身', '单身'], ['relationship', '正在寻觅', '正在寻觅'], ['relationship', '不透露', '不透露'],
    ['profile_tag', '喜欢深聊', '喜欢深聊'], ['profile_tag', '周末散步', '周末散步'], ['profile_tag', '慢热', '慢热'],
    ['preference', '喝杯咖啡', '喝杯咖啡'], ['preference', '看展', '看展'], ['preference', '户外运动', '户外运动'],
  ].map(([groupKey, label, value], sortOrder) => ({ groupKey, key: value, label, value, enabled: true, sortOrder, updatedAt: '' }));
  const options = businessConfig?.profileOptions ?? (localMode ? previewOptions : []);
  const forGroup = (group: string) => options.filter((option) => option.groupKey === group);
  const scalarOptions = (group: string, currentValue: string) => {
    const configured = forGroup(group);
    if (!currentValue || configured.some((option) => option.value === currentValue)) return configured;
    return [{ groupKey: group, key: `historical:${currentValue}`, label: currentValue, value: currentValue, enabled: false, sortOrder: -1, updatedAt: '' }, ...configured];
  };
  const listOptions = (group: 'profile_tag' | 'preference', selected: string[]) => {
    const configured = forGroup(group);
    const historical = selected.filter((value) => !configured.some((option) => option.value === value))
      .map((value, index) => ({ groupKey: group, key: `historical:${index}:${value}`, label: value, value, enabled: false, sortOrder: -1, updatedAt: '' }));
    return [...historical, ...configured];
  };

  function set(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function toggleList(key: 'tags' | 'preferences', value: string) {
    setProfile((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
    setError('');
  }

  async function save() {
    if (!profile.nickname.trim()) {
      setError('昵称不能为空');
      return;
    }
    setPending(true);
    setError('');
    const next = { ...state, profile };
    try {
      await saveProfileRecord(next);
      saveBasicProfile(profile);
      onBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '资料保存失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={`${styles.editor} page`}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>我的资料</small><h1>让别人慢慢了解你</h1></div>
      </header>
      <div className={styles.score}><b>资料完成度</b><i><em /></i><span>80</span></div>
      <section className={styles.cover}>
        <Avatar src="/assets/avatar-me.jpg" name={profile.nickname} size={82} />
        <button type="button" className={styles.changeAvatar}><Camera size={17} />更换头像</button>
        <h2>{profile.nickname}</h2>
        <p>先立体认识自己，再让别人慢慢了解你。</p>
      </section>
      <section className={styles.fields}>
        <h2>基础资料</h2>
        {([['nickname', '昵称'], ['birthDate', '生日'], ['height', '身高'], ['city', '居住地'], ['hometown', '家乡']] as const).map(([key, label]) => (
          <Input key={key} label={label} value={String(profile[key])} onChange={(event) => set(key, event.target.value)} />
        ))}
        {([['gender', '性别'], ['education', '学历'], ['relationship', '情感状态']] as const).map(([key, label]) => (
          <Select key={key} label={label} value={profile[key]} onChange={(event) => set(key, event.target.value)}>
            <option value="">请选择</option>
            {scalarOptions(key, profile[key]).map((option) => (
              <option key={option.key} value={option.value}>{option.label}{option.enabled ? '' : '（已停用）'}</option>
            ))}
          </Select>
        ))}
        <Input label="职业" value={profile.occupation} onChange={(event) => set('occupation', event.target.value)} />
      </section>
      <section className={styles.copySection}>
        <h2>关于我</h2>
        <Textarea value={profile.bio} onChange={(event) => set('bio', event.target.value)} />
        <h2>我的标签</h2>
        <div className={styles.tagPicks}>
          {listOptions('profile_tag', profile.tags).map((option) => (
            <button type="button" className={profile.tags.includes(option.value) ? styles.active : ''} key={option.key} onClick={() => toggleList('tags', option.value)}>
              {option.label}{option.enabled ? '' : '（已停用）'}
            </button>
          ))}
        </div>
        <h2>我的见面偏好</h2>
        <div className={styles.tagPicks}>
          {listOptions('preference', profile.preferences).map((option) => (
            <button type="button" className={profile.preferences.includes(option.value) ? styles.active : ''} key={option.key} onClick={() => toggleList('preferences', option.value)}>
              {option.label}{option.enabled ? '' : '（已停用）'}
            </button>
          ))}
        </div>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <Button wide disabled={pending} onClick={() => void save()} className={styles.submit}>{pending ? '保存中…' : '保存资料'}</Button>
    </main>
  );
}
