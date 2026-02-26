#!/bin/bash
# PostToolUse hook: prevent duplicate utility functions
#
# CLAUDE.md rule: NEVER create local format/utility functions
# when centralized versions exist in @/lib/format or @/lib/utils.
#
# Centralized locations:
#   frontend/src/lib/format.ts
#   admin/src/lib/format.ts
#   */lib/utils.ts
#
# Compatible with macOS grep (no -P flag)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only check TS/TSX files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

# Skip the centralized files themselves, tests, and node_modules
if echo "$FILE" | grep -qE '(node_modules|\.test\.|\.spec\.|lib/format\.|lib/utils\.)'; then
  exit 0
fi

# Functions that MUST come from centralized @/lib/format or @/lib/utils
CENTRALIZED_FUNCS=(
  "formatCurrency"
  "formatPrice"
  "formatDate"
  "formatNumber"
  "formatCents"
  "formatPercentage"
  "cn"
)

WARNINGS=""

for func in "${CENTRALIZED_FUNCS[@]}"; do
  # Check if function is DEFINED locally (function declaration or const arrow)
  if grep -qE "(function[[:space:]]+${func}[[:space:](]|const[[:space:]]+${func}[[:space:]]*=)" "$FILE" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n  - '${func}' definido localmente (deve ser importado de @/lib/format ou @/lib/utils)"
  fi
done

if [ -n "$WARNINGS" ]; then
  echo "ERRO: Funcoes utilitarias duplicadas em $FILE:" >&2
  echo -e "$WARNINGS" >&2
  echo "" >&2
  echo "Use: import { funcName } from '@/lib/format'" >&2
  exit 2  # BLOCKS the edit
fi

exit 0
