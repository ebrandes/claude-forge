import type { HookTemplate } from './index.js'

export const checkLintHook: HookTemplate = {
  id: 'check-lint',
  name: 'ESLint Check',
  description: 'Runs ESLint on modified files after Edit/Write',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 30,
  statusMessage: 'Running ESLint...',
  script: `#!/bin/bash
# PostToolUse hook: runs ESLint on the modified file

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-JS/TS files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\\.(js|jsx|ts|tsx)$'; then
  exit 0
fi

# Find project root (where package.json lives)
DIR="$FILE"
PROJECT_ROOT=""
while [ "$DIR" != "/" ]; do
  DIR=$(dirname "$DIR")
  if [ -f "$DIR/package.json" ]; then
    PROJECT_ROOT="$DIR"
    break
  fi
done

if [ -z "$PROJECT_ROOT" ]; then
  exit 0
fi

cd "$PROJECT_ROOT" || exit 0
OUTPUT=$(npx eslint --no-warn-ignored "$FILE" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "ESLint errors in modified file:" >&2
  echo "$OUTPUT" >&2
  exit 2
fi
`,
}
