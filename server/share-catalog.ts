/** 与前端 club seed 对齐的分享目录（OG / 直达用） */
export interface ShareActivity {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
}

const pics = {
  food: '/assets/food.jpg',
  coffee: '/assets/coffee.jpg',
  hike: '/assets/hike.jpg',
  art: '/assets/art.jpg',
  sport: '/assets/sport.jpg',
  board: '/assets/board.jpg',
} as const;

export const shareActivities: ShareActivity[] = [
  {
    id: 'club-dinner',
    title: '周五轻聊天晚餐局',
    description: '用清楚流程和少人数桌局，降低第一次见面的尴尬。',
    image: pics.food,
    date: '周五 19:30-21:30',
    location: 'KIC / 大学路附近',
  },
  {
    id: 'club-night',
    title: '深度对谈夜局',
    description: '小范围认真聊天，聊聊价值观，不硬社交。',
    image: pics.coffee,
    date: '待定',
    location: '市中心',
  },
  {
    id: 'club-walk',
    title: '我们向月亮走去 · 周五散步局',
    description: '边走边聊，适合怕室内局的人。',
    image: pics.hike,
    date: '周五傍晚',
    location: '滨江',
  },
  {
    id: 'club-workshop',
    title: '关系说明书工作坊',
    description: '用一份关系说明书，练习说出自己的靠近方式。',
    image: pics.art,
    date: '周六 14:00-17:00',
    location: '大学路',
  },
  {
    id: 'club-lunch',
    title: '午间同频小桌',
    description: '一小时，一顿饭的时间，认识附近的人。',
    image: pics.food,
    date: '周三 12:30-13:30',
    location: '静安寺附近',
  },
  {
    id: 'club-exhibit',
    title: '周末看展 + 咖啡',
    description: '一起看展，看完随便聊聊，不需要专业知识。',
    image: pics.art,
    date: '周日 15:00-17:30',
    location: '西岸美术馆',
  },
  {
    id: 'club-poem',
    title: '阳台夜话 · 诗集共读',
    description: '5人小局，读诗也读自己。',
    image: pics.coffee,
    date: '周四 19:30',
    location: '安福路',
  },
];

export function getShareActivity(id: string): ShareActivity | null {
  return shareActivities.find((item) => item.id === id) ?? null;
}

export function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = origin.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderActivityShareHtml(input: {
  activity: ShareActivity;
  pageUrl: string;
  imageUrl: string;
  appUrl: string;
}): string {
  const title = escapeHtml(input.activity.title);
  const description = escapeHtml(
    [input.activity.description, input.activity.date, input.activity.location].filter(Boolean).join(' · '),
  );
  const pageUrl = escapeHtml(input.pageUrl);
  const imageUrl = escapeHtml(input.imageUrl);
  const appUrl = escapeHtml(input.appUrl);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} · 恰好</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="恰好" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <link rel="canonical" href="${appUrl}" />
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
  <style>
    body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f7f5f2;color:#242321}
    main{max-width:420px;margin:40px auto;padding:20px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.06)}
    img{width:100%;border-radius:12px;display:block;margin:12px 0 16px;aspect-ratio:16/10;object-fit:cover;background:#eee}
    a{color:#e85245;font-weight:700}
    p{line-height:1.6;color:#666}
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <img src="${imageUrl}" alt="${title}" />
    <p>${description}</p>
    <p><a href="${appUrl}">打开活动详情</a></p>
  </main>
  <script>location.replace(${JSON.stringify(input.appUrl)})</script>
</body>
</html>`;
}
