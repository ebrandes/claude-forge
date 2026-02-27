import type { HookTemplate } from './index.js'

export const checkPhpLintHook: HookTemplate = {
  id: 'check-php-lint',
  name: 'PHP Lint & Analysis',
  description: 'Runs PHPStan, Pint, or PHP-CS-Fixer on modified PHP files',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 30,
  statusMessage: 'Analyzing PHP code...',
  script: String.raw`#!/bin/bash
# PostToolUse hook: runs static analysis on modified PHP files
# Auto-detects available tool: PHPStan > Pint > PHP-CS-Fixer

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-PHP files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.php$'; then
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

# Try PHPStan first
if [ -f "vendor/bin/phpstan" ] && { [ -f "phpstan.neon" ] || [ -f "phpstan.neon.dist" ]; }; then
  OUTPUT=$(vendor/bin/phpstan analyse "$FILE" --no-progress --error-format=raw 2>&1)
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "PHPStan errors in modified file:" >&2
    echo "$OUTPUT" >&2
    exit 2
  fi
  exit 0
fi

# Try Laravel Pint
if [ -f "vendor/bin/pint" ]; then
  OUTPUT=$(vendor/bin/pint --test "$FILE" 2>&1)
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "Laravel Pint style errors in modified file:" >&2
    echo "$OUTPUT" | tail -20 >&2
    exit 2
  fi
  exit 0
fi

# Try PHP-CS-Fixer
if [ -f "vendor/bin/php-cs-fixer" ]; then
  OUTPUT=$(vendor/bin/php-cs-fixer fix --dry-run --diff "$FILE" 2>&1)
  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo "PHP-CS-Fixer style errors in modified file:" >&2
    echo "$OUTPUT" | tail -20 >&2
    exit 2
  fi
  exit 0
fi
`,
}
