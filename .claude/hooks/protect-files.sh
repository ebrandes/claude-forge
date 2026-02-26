#!/bin/bash
# PreToolUse hook: blocks edits to protected/generated files.
# Prevents accidental modification of production configs, generated types, and hooks.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

[ -z "$FILE" ] && exit 0

PROTECTED_PATTERNS=(
  ".env.production"
  "packages/database/src/types.ts"
  "supabase/config.toml"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE" == *"$pattern"* ]]; then
    echo "BLOQUEADO: $FILE e um arquivo protegido ($pattern)" >&2
    echo "Use o MCP Supabase para regenerar types. Nunca edite .env.production diretamente." >&2
    exit 2
  fi
done

exit 0
