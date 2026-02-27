import type { HookTemplate } from './index.js'

export const protectSensitiveFilesHook: HookTemplate = {
  id: 'protect-sensitive-files',
  name: 'Protect Sensitive Files',
  description:
    'Block AI from reading or modifying sensitive files like .env, credentials, and keys',
  event: 'PreToolUse',
  matcher: 'Edit|Write|Read',
  timeout: 5,
  statusMessage: 'Checking for sensitive files...',
  script: String.raw`#!/bin/bash
INPUT=$(cat)

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
if [ -z "$FILE" ]; then
  exit 0
fi

BASENAME=$(basename "$FILE")
LOWER=$(echo "$BASENAME" | tr '[:upper:]' '[:lower:]')

# Block .env files (any variant)
case "$LOWER" in
  .env|.env.*|*.env) echo "Blocked: sensitive file ($BASENAME)" >&2; exit 2 ;;
esac

# Block credentials, secrets, and key files
case "$LOWER" in
  *credential*|*secret*|*.pem|*.key|*.p12|*.pfx|*.keystore)
    echo "Blocked: sensitive file ($BASENAME)" >&2
    exit 2
    ;;
esac

# Block local settings
if [ "$BASENAME" = "settings.local.json" ]; then
  echo "Blocked: local settings file" >&2
  exit 2
fi

exit 0
`,
}
