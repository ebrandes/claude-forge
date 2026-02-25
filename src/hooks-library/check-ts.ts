import type { HookTemplate } from './index.js'

export const checkTsHook: HookTemplate = {
  id: 'check-ts',
  name: 'TypeScript Check',
  description: 'Validates TypeScript on modified files and their consumers',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 30,
  statusMessage: 'Checking TypeScript...',
  script: `#!/bin/bash
# PostToolUse hook: checks TypeScript errors in the modified file
# AND all files that import it (transitive consumers).

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-TS files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\\.(ts|tsx)$'; then
  exit 0
fi

# Find nearest tsconfig.app.json or tsconfig.json
DIR="$FILE"
TSCONFIG=""
PROJECT_ROOT=""
while [ "$DIR" != "/" ]; do
  DIR=$(dirname "$DIR")
  if [ -f "$DIR/tsconfig.app.json" ]; then
    TSCONFIG="$DIR/tsconfig.app.json"
    PROJECT_ROOT="$DIR"
    break
  elif [ -f "$DIR/tsconfig.json" ]; then
    TSCONFIG="$DIR/tsconfig.json"
    PROJECT_ROOT="$DIR"
    break
  fi
done

if [ -z "$TSCONFIG" ] || [ -z "$PROJECT_ROOT" ]; then
  exit 0
fi

# Get relative path from project root
REL_FILE=$(echo "$FILE" | sed "s|^$PROJECT_ROOT/||")
BASENAME=$(basename "$FILE" | sed 's/\\.[^.]*$//')

# Find all files that import the modified file
IMPORTERS=$(grep -rlE "from ['\\"'].*\${BASENAME}['\\"']" "$PROJECT_ROOT/src" 2>/dev/null \\
  | sed "s|^$PROJECT_ROOT/||" || true)

# Build grep pattern: modified file + all its importers
GREP_PATTERN="$REL_FILE"
for imp in $IMPORTERS; do
  GREP_PATTERN="$GREP_PATTERN|$imp"
done

# Run tsc from project root
cd "$PROJECT_ROOT" || exit 0
TSC_OUTPUT=$(npx tsc --noEmit --project "$TSCONFIG" 2>&1)
FILTERED=$(echo "$TSC_OUTPUT" | grep -E "^($GREP_PATTERN)" || true)

if [ -n "$FILTERED" ]; then
  echo "TypeScript errors in modified file and its consumers:" >&2
  echo "$FILTERED" >&2
  exit 2
fi
`,
}
