import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useClub } from '../../club/ClubContext';
import { useQiahao } from '../../state/QiahaoContext';

const previewOptions = [
  ['gender', '女', '女'], ['gender', '男', '男'], ['gender', '不透露', '不透露'],
  ['education', '本科', '本科'], ['education', '硕士', '硕士'], ['education', '博士', '博士'],
].map(([groupKey, label, value], sortOrder) => ({ groupKey, key: value, label, value, enabled: true, sortOrder, updatedAt: '' }));

export function BasicProfileStep({onNext}:{onNext:()=>void}){
  const{state,saveBasicProfile}=useClub();
  const { businessConfig, localMode } = useQiahao();
  const[profile,setProfile]=useState(state.profile);
  const options = businessConfig?.profileOptions ?? (localMode ? previewOptions : []);
  const forGroup = (group: string) => options.filter((option) => option.groupKey === group);
  function update(key:keyof typeof profile,value:string){setProfile(current=>({...current,[key]:value}))}
  return <section className="onboarding-body"><div className="onboarding-intro"><span>基础资料</span><h1>完善一点基础信息</h1><p>先填最少的部分，后面可以慢慢补充。</p></div><div className="profile-avatar-edit"><img src="/assets/avatar-me.jpg" alt="当前头像"/><button type="button"><Camera size={18}/>更换照片</button></div><div className="profile-fields"><label>昵称<input aria-label="昵称" value={profile.nickname} onChange={e=>update('nickname',e.target.value)}/></label><label>生年月日<input type="date" value={profile.birthDate} onChange={e=>update('birthDate',e.target.value)}/></label><label>性别<select value={profile.gender} onChange={e=>update('gender',e.target.value)}><option value="">请选择</option>{forGroup('gender').map(option=><option key={option.key} value={option.value}>{option.label}</option>)}</select></label><label>学历<select value={profile.education} onChange={e=>update('education',e.target.value)}><option value="">请选择</option>{forGroup('education').map(option=><option key={option.key} value={option.value}>{option.label}</option>)}</select></label><label>职业<input value={profile.occupation} onChange={e=>update('occupation',e.target.value)}/></label></div><button type="button" className="primary-button primary-button--wide" disabled={!profile.nickname.trim()} onClick={()=>{saveBasicProfile(profile);onNext()}}>生成画像</button></section>;
}
