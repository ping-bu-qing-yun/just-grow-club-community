#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_SCRIPT="${ROOT_DIR}/scripts/wechat-cli.sh"
SET_COMPILE_MODE_SCRIPT="${ROOT_DIR}/scripts/wechat-set-compile-mode.js"
CAPTURE_SCRIPT="${ROOT_DIR}/scripts/wechat-gui-capture.sh"
COMPILE_SCRIPT="${ROOT_DIR}/scripts/wechat-gui-compile.sh"
REFRESH_SCRIPT="${ROOT_DIR}/scripts/wechat-gui-refresh.sh"
OUTPUT_DIR="${ROOT_DIR}/tmp/wechat-regression/$(date '+%Y%m%d-%H%M%S')"
PROJECT_WINDOW_KEYWORD="$(node -e "const path=require('path'); const { getAutomationConfig } = require('${ROOT_DIR}/utils/devAutomationConfig'); console.log(path.basename(getAutomationConfig().projectPath));")"
FUNCTIONS=""
SKIP_DEPLOY="false"
SKIP_CAPTURE="false"
CAPTURE_DELAY_SECONDS="${WECHAT_CAPTURE_DELAY_SECONDS:-18}"
DEV_LAUNCH_CONFIG_PATH="${ROOT_DIR}/utils/generatedDevLaunchConfig.js"
DIAGNOSTICS_ROUTE="/pages/dev-tools/dev-tools?autorun=1&capture=1&testType=all"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --functions)
      FUNCTIONS="${2:-}"
      shift 2
      ;;
    --skip-deploy)
      SKIP_DEPLOY="true"
      shift
      ;;
    --skip-capture)
      SKIP_CAPTURE="true"
      shift
      ;;
    --capture-delay)
      CAPTURE_DELAY_SECONDS="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    *)
      echo "[wechat-regression] unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

mkdir -p "${OUTPUT_DIR}"

write_dev_launch_config() {
  local once_token="$1"
  local expires_at_ms
  expires_at_ms="$(node -e "console.log(Date.now() + 5 * 60 * 1000)")"
  cat >"${DEV_LAUNCH_CONFIG_PATH}" <<EOF
module.exports = {
  enabled: true,
  path: '${DIAGNOSTICS_ROUTE}',
  onceToken: '${once_token}',
  waitMs: 1800,
  expiresAt: ${expires_at_ms}
};
EOF
}

cleanup_dev_launch_config() {
  cat >"${DEV_LAUNCH_CONFIG_PATH}" <<'EOF'
module.exports = {
  enabled: false,
  path: '',
  onceToken: '',
  waitMs: 1200,
  expiresAt: 0
};
EOF
}

trap cleanup_dev_launch_config EXIT

RUN_TOKEN="wechat-regression-$(date '+%Y%m%d-%H%M%S')"
write_dev_launch_config "${RUN_TOKEN}"

{
  echo "[wechat-regression] output_dir=${OUTPUT_DIR}"
  echo "[wechat-regression] select compile mode"
  node "${SET_COMPILE_MODE_SCRIPT}"

  echo "[wechat-regression] open project"
  "${CLI_SCRIPT}" open

  echo "[wechat-regression] check login"
  "${CLI_SCRIPT}" islogin

  echo "[wechat-regression] list cloud functions"
  "${CLI_SCRIPT}" list-functions

  if [[ "${SKIP_DEPLOY}" != "true" ]]; then
    if [[ -z "${FUNCTIONS}" ]]; then
      FUNCTIONS="$(node -e "const { getAutomationConfig } = require('${ROOT_DIR}/utils/devAutomationConfig'); console.log(getAutomationConfig().defaultFunctionNames.join(' '));")"
    else
      FUNCTIONS="$(echo "${FUNCTIONS}" | tr ',' ' ')"
    fi

    echo "[wechat-regression] deploy functions: ${FUNCTIONS}"
    # shellcheck disable=SC2086
    "${CLI_SCRIPT}" deploy-functions ${FUNCTIONS}
  fi
} | tee "${OUTPUT_DIR}/cli.log"

echo "[wechat-regression] trigger local compile" | tee -a "${OUTPUT_DIR}/cli.log"
WECHAT_DEVTOOLS_WINDOW_KEYWORD="${PROJECT_WINDOW_KEYWORD}" "${COMPILE_SCRIPT}" | tee -a "${OUTPUT_DIR}/cli.log"
sleep 2
echo "[wechat-regression] trigger local refresh" | tee -a "${OUTPUT_DIR}/cli.log"
WECHAT_DEVTOOLS_WINDOW_KEYWORD="${PROJECT_WINDOW_KEYWORD}" "${REFRESH_SCRIPT}" | tee -a "${OUTPUT_DIR}/cli.log"

if [[ "${SKIP_CAPTURE}" != "true" ]]; then
  echo "[wechat-regression] wait ${CAPTURE_DELAY_SECONDS}s for diagnostics autorun" | tee -a "${OUTPUT_DIR}/cli.log"
  sleep "${CAPTURE_DELAY_SECONDS}"
  WECHAT_DEVTOOLS_WINDOW_KEYWORD="${PROJECT_WINDOW_KEYWORD}" "${CAPTURE_SCRIPT}" "${OUTPUT_DIR}/dev-tools.png" | tee -a "${OUTPUT_DIR}/cli.log"
fi

cat <<EOF | tee "${OUTPUT_DIR}/next-step.txt"
CLI automation completed.

Artifacts:
1. CLI log: ${OUTPUT_DIR}/cli.log
2. Screenshot: ${OUTPUT_DIR}/dev-tools.png

Current automation route:
${DIAGNOSTICS_ROUTE}

TODO:
- Add a diagnostics page at the route above
- Add a guarded diagnostics cloud function before exposing global data
EOF
