#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

read_config() {
  local key="$1"
  node -e "const { getAutomationConfig } = require('${ROOT_DIR}/utils/devAutomationConfig'); const c = getAutomationConfig(); const value = c['${key}']; if (Array.isArray(value)) { console.log(value.join(',')); } else { console.log(value); }"
}

CLI_PATH="$(read_config devtoolsCliPath)"
PROJECT_PATH="$(read_config projectPath)"
PORT="$(read_config devtoolsPort)"
ENV_ID="$(read_config envId)"

if [[ ! -x "${CLI_PATH}" ]]; then
  echo "[wechat-cli] CLI not found or not executable: ${CLI_PATH}" >&2
  exit 1
fi

run_cli() {
  "${CLI_PATH}" "$@" --project "${PROJECT_PATH}" --port "${PORT}"
}

COMMAND="${1:-}"
shift || true

case "${COMMAND}" in
  islogin)
    run_cli islogin "$@"
    ;;
  open)
    run_cli open "$@"
    ;;
  close)
    run_cli close "$@"
    ;;
  quit)
    run_cli quit "$@"
    ;;
  list-functions)
    run_cli cloud functions list -e "${ENV_ID}" "$@"
    ;;
  deploy-functions)
    if [[ $# -eq 0 ]]; then
      echo "[wechat-cli] deploy-functions requires at least one function name" >&2
      exit 1
    fi
    run_cli cloud functions deploy -e "${ENV_ID}" -n "$@" --provided --remote-npm-install
    ;;
  *)
    cat <<'EOF' >&2
Usage:
  scripts/wechat-cli.sh islogin
  scripts/wechat-cli.sh open
  scripts/wechat-cli.sh close
  scripts/wechat-cli.sh quit
  scripts/wechat-cli.sh list-functions
  scripts/wechat-cli.sh deploy-functions <name...>
EOF
    exit 1
    ;;
esac
