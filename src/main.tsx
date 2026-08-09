import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installAssetFallbacks } from './lib/assets';
import './styles/global.css';

installAssetFallbacks();

if (new URLSearchParams(window.location.search).get('reset') === 'registration') {
  for (const key of Object.keys(window.localStorage)) {
    if (
      key === 'qiahao-auth-token' ||
      key === 'qiahao-state-v1' ||
      key === 'qiahao-content-cache-v1' ||
      key.startsWith('qiahao-club-state-v1') ||
      key.startsWith('qiahao-notifications-v2')
    ) {
      window.localStorage.removeItem(key);
    }
  }
  window.history.replaceState(null, '', window.location.pathname);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
