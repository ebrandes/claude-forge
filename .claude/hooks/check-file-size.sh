#!/bin/bash
# PostToolUse hook: enforces the 400-line limit per file (CLAUDE.md rule)
# Blocks (exit 2) if file exceeds 400 lines, warns if > 300 lines.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip if no file path or file doesn't exist
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# Only check source files
echo "$FILE" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0

# Skip auto-generated files
echo "$FILE" | grep -qE '(types\.ts|\.gen\.|\.d\.ts|supabase/types)' && exit 0

LINES=$(wc -l < "$FILE" | tr -d ' ')

if [ "$LINES" -gt 400 ]; then
  echo "ARQUIVO EXCEDE LIMITE: $FILE tem $LINES linhas (max 400)" >&2
  echo "Divida em componentes menores, hooks ou utils." >&2
  exit 2
fi

if [ "$LINES" -gt 300 ]; then
  echo "AVISO: $FILE tem $LINES linhas (ideal < 300, max 400)" >&2
fi

exit 0
