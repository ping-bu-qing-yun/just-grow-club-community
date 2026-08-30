const path = require('path');

const DEFAULT_DEVTOOLS_CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const DEFAULT_DEVTOOLS_PORT = 54448;
const DEFAULT_ENV_ID = 'cloud1-d5gw01teoed1301d0';
const DEFAULT_FUNCTION_NAMES = ["login", "userProfile", "activityCatalog", "activityData"];
const DEFAULT_COMPILE_MODE_NAME = 'dev-tools-autorun';

function getProjectPath() {
  return path.resolve(__dirname, '..');
}

function parsePort(value) {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : DEFAULT_DEVTOOLS_PORT;
}

function splitFunctionNames(value) {
  if (!value) {
    return [...DEFAULT_FUNCTION_NAMES];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAutomationConfig() {
  return {
    projectPath: getProjectPath(),
    devtoolsCliPath: process.env.WECHAT_DEVTOOLS_CLI_PATH || DEFAULT_DEVTOOLS_CLI_PATH,
    devtoolsPort: parsePort(process.env.WECHAT_DEVTOOLS_PORT),
    envId: process.env.WECHAT_CLOUD_ENV_ID || DEFAULT_ENV_ID,
    defaultFunctionNames: splitFunctionNames(process.env.WECHAT_DEFAULT_FUNCTIONS),
    defaultCompileModeName: process.env.WECHAT_DEFAULT_COMPILE_MODE || DEFAULT_COMPILE_MODE_NAME
  };
}

module.exports = {
  DEFAULT_DEVTOOLS_CLI_PATH,
  DEFAULT_DEVTOOLS_PORT,
  DEFAULT_ENV_ID,
  DEFAULT_FUNCTION_NAMES,
  DEFAULT_COMPILE_MODE_NAME,
  getProjectPath,
  getAutomationConfig,
  splitFunctionNames
};
