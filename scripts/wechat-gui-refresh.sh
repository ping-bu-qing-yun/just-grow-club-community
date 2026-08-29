#!/usr/bin/env bash
set -euo pipefail

PROCESS_NAME="${WECHAT_DEVTOOLS_PROCESS_NAME:-微信开发者工具}"
WINDOW_KEYWORD="${WECHAT_DEVTOOLS_WINDOW_KEYWORD:-}"
ACTIVATE_DELAY_MS="${WECHAT_REFRESH_ACTIVATE_DELAY_MS:-1200}"

activate_delay_seconds="$(node -e "console.log((Number(process.argv[1]) || 1200) / 1000)" "${ACTIVATE_DELAY_MS}")"

osascript <<OSA
tell application "System Events"
  if not (exists process "${PROCESS_NAME}") then
    error "process not found: ${PROCESS_NAME}"
  end if

  tell process "${PROCESS_NAME}"
    set frontmost to true
    delay ${activate_delay_seconds}

    if "${WINDOW_KEYWORD}" is not "" then
      repeat with candidateWindow in every window
        try
          if (name of candidateWindow) contains "${WINDOW_KEYWORD}" then
            perform action "AXRaise" of candidateWindow
            exit repeat
          end if
        end try
      end repeat
    end if

    keystroke "r" using command down
  end tell
end tell
OSA

echo "[wechat-gui-refresh] triggered refresh"
