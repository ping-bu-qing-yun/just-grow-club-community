import type { UserSummary } from '../domain/types';

export function AvatarStack({ users, max = 3 }: { users: UserSummary[]; max?: number }) {
  const visible = users.slice(0, max);
  const remainder = users.length - visible.length;

  return (
    <div className="avatar-stack" aria-label={`${users.length} 人已加入`}>
      {visible.map((user) => (
        <img key={user.id} src={user.avatar} alt={user.name} />
      ))}
      {remainder > 0 && <span>+{remainder}</span>}
    </div>
  );
}

