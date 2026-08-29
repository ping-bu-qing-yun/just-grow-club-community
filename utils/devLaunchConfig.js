const DEFAULT_DEV_LAUNCH_CONFIG = Object.freeze({
  enabled: false,
  path: '',
  onceToken: '',
  waitMs: 1200,
  expiresAt: 0
});

function normalizePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function sanitizeLaunchConfig(input) {
  const config = input && typeof input === 'object' ? input : {};
  const path = typeof config.path === 'string' ? config.path.trim() : '';

  return {
    enabled: Boolean(config.enabled && path),
    path,
    onceToken: typeof config.onceToken === 'string' ? config.onceToken.trim() : '',
    waitMs: normalizePositiveNumber(config.waitMs, DEFAULT_DEV_LAUNCH_CONFIG.waitMs),
    expiresAt: normalizePositiveNumber(config.expiresAt, DEFAULT_DEV_LAUNCH_CONFIG.expiresAt)
  };
}

function loadGeneratedOverride(loadModule) {
  const moduleLoader = loadModule || (() => require('./generatedDevLaunchConfig.js'));
  try {
    return sanitizeLaunchConfig(moduleLoader());
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      return { ...DEFAULT_DEV_LAUNCH_CONFIG };
    }
    throw error;
  }
}

function getDevLaunchConfig(loadModule) {
  return loadGeneratedOverride(loadModule);
}

function isLaunchConfigActive(config, nowMs = Date.now()) {
  if (!config || !config.enabled || !config.path) {
    return false;
  }

  if (!config.expiresAt) {
    return true;
  }

  return nowMs <= config.expiresAt;
}

module.exports = {
  DEFAULT_DEV_LAUNCH_CONFIG,
  getDevLaunchConfig,
  isLaunchConfigActive,
  loadGeneratedOverride,
  sanitizeLaunchConfig
};
