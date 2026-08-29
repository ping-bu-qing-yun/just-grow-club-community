#!/usr/bin/env bash
set -euo pipefail

OUTPUT_PATH="${1:-}"
PROCESS_NAME="${WECHAT_DEVTOOLS_PROCESS_NAME:-微信开发者工具}"
WINDOW_KEYWORD="${WECHAT_DEVTOOLS_WINDOW_KEYWORD:-}"
ACTIVATE_DELAY_MS="${WECHAT_CAPTURE_ACTIVATE_DELAY_MS:-1500}"

if [[ -z "${OUTPUT_PATH}" ]]; then
  echo "Usage: scripts/wechat-gui-capture.sh <output-path>" >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_PATH}")"

activate_delay_seconds="$(node -e "console.log((Number(process.argv[1]) || 1500) / 1000)" "${ACTIVATE_DELAY_MS}")"

bounds="$(
  osascript <<OSA
tell application "System Events"
  if not (exists process "${PROCESS_NAME}") then
    error "process not found: ${PROCESS_NAME}"
  end if

  tell process "${PROCESS_NAME}"
    set frontmost to true
    delay ${activate_delay_seconds}
    set targetWindow to front window

    if "${WINDOW_KEYWORD}" is not "" then
      repeat with candidateWindow in every window
        try
          if (name of candidateWindow) contains "${WINDOW_KEYWORD}" then
            set targetWindow to candidateWindow
            exit repeat
          end if
        end try
      end repeat
    end if

    try
      perform action "AXRaise" of targetWindow
      delay 0.3
    end try

    set {xPos, yPos} to position of targetWindow
    set {winWidth, winHeight} to size of targetWindow
    return (xPos as text) & "," & (yPos as text) & "," & (winWidth as text) & "," & (winHeight as text)
  end tell
end tell
OSA
)"

if [[ -z "${bounds}" ]]; then
  echo "[wechat-gui-capture] failed to resolve window bounds" >&2
  exit 1
fi

screencapture -x -R "${bounds}" "${OUTPUT_PATH}"
echo "[wechat-gui-capture] captured ${OUTPUT_PATH} bounds=${bounds}"
