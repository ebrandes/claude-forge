#!/bin/bash
# PostToolUse hook: flag complex regex patterns without tests
#
# The Cloudinary URL regex bug happened because the regex
# was never tested with real production URLs (with transformations).
# This hook warns when complex regex is written without corresponding tests.
#
# Compatible with macOS grep (no -P flag)

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE" ]; then
  exit 0
fi

# Skip test files, node_modules, config files
if echo "$FILE" | grep -qE '(node_modules|\.test\.|\.spec\.|__test__|\.config\.)'; then
  exit 0
fi

WARNINGS=""

# --- Python: complex re.search/re.match/re.sub/re.compile ---
if echo "$FILE" | grep -qE '\.py$'; then
  # Find lines with regex calls
  HAS_REGEX=$(grep -nE 're\.(search|match|sub|compile|findall)[[:space:]]*\(' "$FILE" 2>/dev/null)

  if [ -n "$HAS_REGEX" ]; then
    # Check if any regex pattern string is longer than 40 chars
    # Look for r"..." or r'...' patterns
    LONG_REGEX=$(grep -E 're\.(search|match|sub|compile|findall)' "$FILE" | awk '{
      # Count chars between quotes in regex patterns
      if (length($0) > 60) print $0
    }')

    if [ -n "$LONG_REGEX" ]; then
      # Check if a test file exists for this module
      BASENAME=$(basename "$FILE" .py)
      DIRNAME=$(dirname "$FILE")
      PROJECT_ROOT=$(git -C "$DIRNAME" rev-parse --show-toplevel 2>/dev/null || echo "$DIRNAME")

      HAS_TEST=$(find "$PROJECT_ROOT" -name "test_${BASENAME}.py" -o -name "${BASENAME}_test.py" 2>/dev/null | head -1)

      if [ -z "$HAS_TEST" ]; then
        WARNINGS="${WARNINGS}\n  Regex complexo encontrado sem arquivo de teste correspondente."
        WARNINGS="${WARNINGS}\n  Arquivo: $FILE"
        WARNINGS="${WARNINGS}\n  Considere criar test_${BASENAME}.py com edge cases."
        WARNINGS="${WARNINGS}\n  (URLs com transformacoes, paths com caracteres especiais, etc.)"
      fi
    fi
  fi
fi

# --- TypeScript: complex regex literals ---
if echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
  # Match lines with regex that are likely complex (long lines with / delimiters)
  LONG_REGEX=$(grep -nE '/[^/]{40,}/[gimsuy]*' "$FILE" 2>/dev/null)

  if [ -n "$LONG_REGEX" ]; then
    BASENAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
    DIRNAME=$(dirname "$FILE")
    PROJECT_ROOT=$(git -C "$DIRNAME" rev-parse --show-toplevel 2>/dev/null || echo "$DIRNAME")

    HAS_TEST=$(find "$PROJECT_ROOT" -name "${BASENAME}.test.*" -o -name "${BASENAME}.spec.*" 2>/dev/null | head -1)

    if [ -z "$HAS_TEST" ]; then
      WARNINGS="${WARNINGS}\n  Regex complexo encontrado sem arquivo de teste correspondente."
      WARNINGS="${WARNINGS}\n  Arquivo: $FILE"
      WARNINGS="${WARNINGS}\n  Considere criar ${BASENAME}.test.ts com edge cases."
    fi
  fi
fi

if [ -n "$WARNINGS" ]; then
  echo "AVISO - Regex complexo sem testes:" >&2
  echo -e "$WARNINGS" >&2
  echo "" >&2
  # Warning only, does not block
  exit 0
fi

exit 0
