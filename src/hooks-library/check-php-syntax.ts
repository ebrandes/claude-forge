import type { HookTemplate } from './index.js'

export const checkPhpSyntaxHook: HookTemplate = {
  id: 'check-php-syntax',
  name: 'PHP Syntax Check',
  description: 'Validates PHP syntax on modified files using php -l',
  event: 'PostToolUse',
  matcher: 'Edit|Write',
  timeout: 15,
  statusMessage: 'Checking PHP syntax...',
  script: String.raw`#!/bin/bash
# PostToolUse hook: checks PHP syntax errors in the modified file

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-PHP files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\\.php$'; then
  exit 0
fi

# Check if php is available
if ! command -v php &>/dev/null; then
  exit 0
fi

OUTPUT=$(php -l "$FILE" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "PHP syntax error in modified file:" >&2
  echo "$OUTPUT" >&2
  exit 2
fi
`,
}
