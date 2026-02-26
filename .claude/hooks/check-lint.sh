#!/bin/bash
# PostToolUse hook: runs ESLint on the modified file.
# Blocks (exit 2) if ESLint finds errors.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-TS files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

# Skip generated files
echo "$FILE" | grep -qE '(types\.ts|\.gen\.|\.d\.ts|supabase/types)' && exit 0

# Find nearest project root with eslint config
DIR="$FILE"
PROJECT_ROOT=""
while [ "$DIR" != "/" ]; do
  DIR=$(dirname "$DIR")
  if [ -f "$DIR/eslint.config.js" ] || [ -f "$DIR/eslint.config.mjs" ]; then
    PROJECT_ROOT="$DIR"
    break
  fi
done

[ -z "$PROJECT_ROOT" ] && exit 0

cd "$PROJECT_ROOT" || exit 0
LINT_OUTPUT=$(npx eslint --no-warn-ignored "$FILE" 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  # Filter to show only the most relevant error lines
  ERRORS=$(echo "$LINT_OUTPUT" | grep -E "^\s+[0-9]+:[0-9]+\s+error" | head -10)
  if [ -n "$ERRORS" ]; then
    echo "ESLint errors in $FILE:" >&2
    echo "$ERRORS" >&2
    exit 2
  fi
fi

exit 0
