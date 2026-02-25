import type { HookTemplate } from './index.js'

export const checkTestsHook: HookTemplate = {
  id: 'check-tests',
  name: 'Related Tests',
  description: 'Runs tests related to modified files after Edit/Write',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 60,
  statusMessage: 'Running related tests...',
  script: `#!/bin/bash
# PostToolUse hook: runs tests related to the modified file

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-source files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\\.(js|jsx|ts|tsx)$'; then
  exit 0
fi

# Skip if file is already a test file
if echo "$FILE" | grep -qE '\\.(test|spec)\\.(js|jsx|ts|tsx)$'; then
  exit 0
fi

# Find project root
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

# Try to find related test file
BASENAME=$(basename "$FILE" | sed 's/\\.[^.]*$//')
REL_DIR=$(dirname "$FILE" | sed "s|^$PROJECT_ROOT/||")
TEST_FILE=$(find "$REL_DIR" -name "$BASENAME.test.*" -o -name "$BASENAME.spec.*" 2>/dev/null | head -1)

if [ -z "$TEST_FILE" ]; then
  exit 0
fi

OUTPUT=$(npx vitest run "$TEST_FILE" --reporter=verbose 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "Test failures related to modified file:" >&2
  echo "$OUTPUT" | tail -20 >&2
  exit 2
fi
`,
}
