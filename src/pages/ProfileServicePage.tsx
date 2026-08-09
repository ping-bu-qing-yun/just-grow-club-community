import { ArrowLeft, Bell, CircleHelp, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export type ProfileServiceKind = 'help' | 'safety' | 'settings';

const copy = {
  help: {
    label: 'HELP',
    title: '帮助与客服',
    intro: '常见问题可以先在这里看，复杂情况再找小CC处理。',
    Icon: CircleHelp,
  },
  safety: {
    label: 'SAFETY',
    title: '安全中心',
    intro: '第一次见面优先选择公共场所，不舒服时可以随时退出。',
    Icon: ShieldCheck,
  },
  settings: {
    label: 'SETTINGS',
    title: '设置',
    intro: '管理通知、授权与账号偏好。',
    Icon: Bell,
  },
} satisfies Record<ProfileServiceKind, { label: string; title: string; intro: string; Icon: typeof CircleHelp }>;

export function ProfileServicePage({ kind, onBack }: { kind: ProfileServiceKind; onBack: () => void }) {
  const [notice, setNotice] = useState(true);
  const [privacy, setPrivacy] = useState(true);
  const { Icon, label, title, intro } = copy[kind];

  return (
    <main className="page standard-page profile-service-page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>{label}</small><h1>{title}</h1></div>
      </header>
      <section className="profile-service-hero">
        <Icon size={24} />
        <p>{intro}</p>
      </section>

      {kind === 'help' ? (
        <section className="profile-service-list">
          <article><b>报名后在哪里看集合信息？</b><p>进入「我的消息」可以查看活动群聊和系统提醒。</p></article>
          <article><b>临时不能参加怎么办？</b><p>在活动详情或消息里联系小CC，灰度版会优先人工处理。</p></article>
          <article><b>如何联系小CC？</b><p>已为你记录客服入口，正式小程序会接入微信客服。</p></article>
        </section>
      ) : null}

      {kind === 'safety' ? (
        <section className="profile-service-list">
          <article><b>线下见面边界</b><p>不强制交换联系方式，不公开个人隐私，不舒服时可以直接离开。</p></article>
          <article><b>举报与拉黑</b><p>灰度前建议补齐举报表单、证据上传和运营处理状态。</p></article>
          <article><b>公共场所提醒</b><p>首次见面建议选择公共空间，并把行程告诉信任的人。</p></article>
        </section>
      ) : null}

      {kind === 'settings' ? (
        <section className="profile-service-list profile-service-list--settings">
          <label><span><b>活动通知</b><small>报名、集合、反馈提醒</small></span><input type="checkbox" checked={notice} onChange={(event) => setNotice(event.target.checked)} /></label>
          <label><span><b>隐私保护提醒</b><small>线下见面前的安全边界提示</small></span><input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} /></label>
        </section>
      ) : null}
    </main>
  );
}
