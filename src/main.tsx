import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/utilities.css';
// Transitional: page/component styles are being migrated to *.module.css;
// global.css is removed once every surface is rebuilt (see refactor plan).
import './styles/global.css';
import { applyThemePreference, readThemePreference } from './theme/theme';

applyThemePreference(readThemePreference());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
