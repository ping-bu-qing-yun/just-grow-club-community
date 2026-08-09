import type { RowDataPacket } from 'mysql2/promise';
import type { QiahaoDatabase } from './db';

/** 活动分享卡片字段，生产数据只从 MySQL 活动读取。 */
export interface ShareActivity {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
}

type ShareActivityRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  image: string;
  date_label: string;
  time: string;
  location: string;
};

export async function resolveShareActivity(database: QiahaoDatabase, id: string): Promise<ShareActivity | null> {
  const rows = await database.query<ShareActivityRow[]>(
    `SELECT a.id,a.title,a.description,a.image,a.date_label,a.time,a.location
       FROM activities a
       JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
      WHERE a.id=? AND a.lifecycle<>'archived'
      LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    date: `${row.date_label} · ${row.time}`,
    location: row.location,
  };
}

export function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = origin.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** 微信抓图必须用公网可访问的绝对 URL；优先资源域名，再前端域名 */
export function resolveShareImageUrl(imagePath: string, frontendOrigin: string): string {
  const assetOrigin = (process.env.QIAHAO_ASSET_ORIGIN || process.env.QIAHAO_WEB_ORIGIN || frontendOrigin).replace(
    /\/$/,
    '',
  );
  return absoluteUrl(assetOrigin, imagePath);
}

export function resolveFrontendOrigin(fallback = 'http://127.0.0.1:5174'): string {
  return (process.env.QIAHAO_WEB_ORIGIN || fallback).replace(/\/$/, '');
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
