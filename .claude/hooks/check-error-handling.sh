#!/bin/bash
# PostToolUse hook: detect problematic catch blocks
#
# Catches patterns that caused real bugs in this project:
# 1. catch + return = silently blocks the main flow
# 2. catch with empty body = swallows errors completely
#
# Compatible with macOS grep (no -P flag)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only check TS/TSX/Python files
if [ -z "$FILE" ] || ! echo "$FILE" | grep -qE '\.(ts|tsx|py)$'; then
  exit 0
fi

# Skip test files and node_modules
if echo "$FILE" | grep -qE '(node_modules|\.test\.|\.spec\.|__test__)'; then
  exit 0
fi

WARNINGS=""

# --- TypeScript / TSX checks ---
if echo "$FILE" | grep -qE '\.(ts|tsx)$'; then

  # Pattern 1: catch block that returns early (blocks main flow silently)
  # This was the exact bug in product-gallery.tsx
  CATCH_LINES=$(grep -n 'catch' "$FILE" | grep -E 'catch[[:space:]]*(\(|{)' | cut -d: -f1)
  for LINE_NUM in $CATCH_LINES; do
    # Look at the next 5 lines after catch for a bare "return" or "return;"
    CATCH_BODY=$(sed -n "$((LINE_NUM+1)),$((LINE_NUM+5))p" "$FILE")
    if echo "$CATCH_BODY" | grep -qE '^[[:space:]]*return[[:space:]]*;?[[:space:]]*$'; then
      WARNINGS="${WARNINGS}\n  - Linha $LINE_NUM: catch com 'return' que pode bloquear o fluxo principal silenciosamente"
    fi
  done

  # Pattern 2: empty catch block  { }
  if grep -qE 'catch[[:space:]]*(\([^)]*\))?[[:space:]]*\{[[:space:]]*\}' "$FILE" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n  - catch block vazio (engolindo erros silenciosamente)"
  fi
fi

# --- Python checks ---
if echo "$FILE" | grep -qE '\.py$'; then

  # Pattern: bare except with pass
  EXCEPT_LINES=$(grep -n 'except' "$FILE" | grep -E 'except.*:' | cut -d: -f1)
  for LINE_NUM in $EXCEPT_LINES; do
    NEXT_LINE=$(sed -n "$((LINE_NUM+1))p" "$FILE")
    if echo "$NEXT_LINE" | grep -qE '^[[:space:]]*pass[[:space:]]*$'; then
      WARNINGS="${WARNINGS}\n  - Linha $LINE_NUM: except com 'pass' (engolindo erros silenciosamente)"
    fi
  done

  # Pattern: except that only returns False without logging
  for LINE_NUM in $EXCEPT_LINES; do
    NEXT_LINE=$(sed -n "$((LINE_NUM+1))p" "$FILE")
    if echo "$NEXT_LINE" | grep -qE '^[[:space:]]*return[[:space:]]+False[[:space:]]*$'; then
      WARNINGS="${WARNINGS}\n  - Linha $LINE_NUM: except que retorna False sem logging (falha silenciosa)"
    fi
  done
fi

if [ -n "$WARNINGS" ]; then
  echo "AVISO em $FILE:" >&2
  echo -e "$WARNINGS" >&2
  echo "" >&2
  echo "Verifique se os error paths estao tratados corretamente." >&2
  # exit 0 = warning only, does not block
  exit 0
fi

exit 0
