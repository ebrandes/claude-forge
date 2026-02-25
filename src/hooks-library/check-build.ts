import type { HookTemplate } from './index.js'

export const checkBuildHook: HookTemplate = {
  id: 'check-build',
  name: 'Build Check',
  description: 'Runs project build after changes to catch build-time errors',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 60,
  statusMessage: 'Checking build...',
  script: `#!/bin/bash
# PostToolUse hook: runs build to catch errors that tsc alone misses
# (dynamic imports, SSR issues, bundle errors, env vars)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-source files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\\.(ts|tsx|js|jsx)$'; then
  exit 0
fi

# Only run on significant files (skip test files, configs)
if echo "$FILE" | grep -qE '\\.(test|spec|config)\\.(ts|tsx|js|jsx)$'; then
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

# Detect build command
if [ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ]; then
  OUTPUT=$(npx next build --no-lint 2>&1)
elif grep -q '"build"' package.json 2>/dev/null; then
  OUTPUT=$(npm run build 2>&1)
else
  exit 0
fi

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  # Show only the last 30 lines to keep output manageable
  echo "Build failed after editing $FILE:" >&2
  echo "$OUTPUT" | tail -30 >&2
  exit 2
fi
`,
}
