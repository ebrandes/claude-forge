import type { HookTemplate } from './index.js'

export const checkPhpTestsHook: HookTemplate = {
  id: 'check-php-tests',
  name: 'PHP Related Tests',
  description: 'Runs Pest or PHPUnit tests related to modified PHP files',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 60,
  statusMessage: 'Running related PHP tests...',
  script: String.raw`#!/bin/bash
# PostToolUse hook: runs PHP tests related to the modified file
# Auto-detects: Pest > PHPUnit

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-PHP files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.php$'; then
  exit 0
fi

# Skip if file is already a test
if echo "$FILE" | grep -qE '(Test|test)\.php$'; then
  exit 0
fi

# Find project root (where composer.json lives)
DIR="$FILE"
PROJECT_ROOT=""
while [ "$DIR" != "/" ]; do
  DIR=$(dirname "$DIR")
  if [ -f "$DIR/composer.json" ]; then
    PROJECT_ROOT="$DIR"
    break
  fi
done

if [ -z "$PROJECT_ROOT" ]; then
  exit 0
fi

cd "$PROJECT_ROOT" || exit 0

# Extract class name from filename (e.g., UserService.php -> UserService)
CLASSNAME=$(basename "$FILE" .php)

# Build search patterns using variable concatenation to avoid template conflicts
PATTERN_TEST="$CLASSNAME"'Test.php'
PATTERN_TEST2="$CLASSNAME"'test.php'

# Try to find a related test file
TEST_FILE=$(find tests -name "$PATTERN_TEST" -o -name "$PATTERN_TEST2" 2>/dev/null | head -1)

if [ -z "$TEST_FILE" ]; then
  # No related test found — skip silently
  exit 0
fi

# Run with Pest if available, otherwise PHPUnit
if [ -f "vendor/bin/pest" ]; then
  OUTPUT=$(vendor/bin/pest "$TEST_FILE" --no-progress 2>&1)
elif [ -f "vendor/bin/phpunit" ]; then
  OUTPUT=$(vendor/bin/phpunit "$TEST_FILE" --no-progress 2>&1)
else
  exit 0
fi

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "PHP test failures related to modified file:" >&2
  echo "$OUTPUT" | tail -20 >&2
  exit 2
fi
`,
}
