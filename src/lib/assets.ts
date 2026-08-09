const rawAssetHost = 'https://raw.githubusercontent.com/ping-bu-qing-yun/just-grow-club-community/gh-pages';
const meta = import.meta as ImportMeta & { env?: { BASE_URL?: string } };

function normalizePath(path: string) {
  return path.startsWith('/') ? path.slice(1) : path;
}

function isExternalPreview() {
  return typeof window !== 'undefined' && window.location.hostname === 'htmlpreview.github.io';
}

export function assetUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^(data:|blob:|https?:)/.test(path)) return path;

  const normalized = normalizePath(path);
  if (isExternalPreview()) return `${rawAssetHost}/${normalized}`;

  const base = meta.env?.BASE_URL ?? './';
  if (typeof window !== 'undefined') {
    return new URL(`${base}${normalized}`, window.location.href).href;
  }
  return `${base}${normalized}`;
}

export function installAssetFallbacks() {
  if (typeof document === 'undefined') return;

  document.documentElement.style.setProperty('--welcome-bg', `url("${assetUrl('/assets/welcome-bg.png')}")`);
  document.documentElement.style.setProperty('--portrait-bg', `url("${assetUrl('/assets/portrait-ai-bg.png')}")`);

  const rewriteImages = () => {
    document.querySelectorAll<HTMLImageElement>('img[src^="/assets/"], img[src^="/brand-mark.svg"]').forEach((image) => {
      const original = image.getAttribute('src');
      if (!original) return;
      image.src = assetUrl(original);
    });
  };

  rewriteImages();
  const observer = new MutationObserver(rewriteImages);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
