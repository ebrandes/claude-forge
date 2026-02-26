import type { HookTemplate } from './index.js'

export const checkLintStagedHook: HookTemplate = {
  id: 'check-lint-staged',
  name: 'Lint & Format Check',
  description: 'Runs ESLint fix + Prettier on modified files',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 30,
  statusMessage: 'Linting & formatting...',
  script: String.raw`#!/bin/bash
# PostToolUse hook: auto-fix lint + format on modified file

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-JS/TS files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.(js|jsx|ts|tsx)$'; then
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

# Run ESLint with auto-fix (non-blocking: fix what we can)
if [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
  LINT_OUTPUT=$(npx eslint --fix --no-warn-ignored "$FILE" 2>&1)
  LINT_EXIT=$?

  # Only fail on errors that couldn't be auto-fixed
  if [ $LINT_EXIT -ne 0 ]; then
    ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error" || true)
    if [ "$ERRORS" -gt 0 ]; then
      echo "ESLint errors that could not be auto-fixed:" >&2
      echo "$LINT_OUTPUT" | grep "error" >&2
      exit 2
    fi
  fi
fi

# Run Prettier if available (non-blocking: just format)
if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ]; then
  npx prettier --write "$FILE" 2>/dev/null || true
fi
`,
}
