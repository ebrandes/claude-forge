import type { HookTemplate } from './index.js'

export const stopTestCheckHook: HookTemplate = {
  id: 'stop-test-check',
  name: 'Test Check on Stop',
  description: 'Run project tests at the end of each AI response to catch regressions',
  event: 'Stop',
  matcher: '',
  timeout: 180,
  statusMessage: 'Running test check...',
  script: String.raw`#!/bin/bash

# Check if source files were modified in this session
CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|php|vue|svelte)$' | head -1)
if [ -z "$CHANGED" ]; then
  exit 0
fi

# Find project root
DIR=$(pwd)
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/package.json" ] || [ -f "$DIR/composer.json" ]; then
    break
  fi
  DIR=$(dirname "$DIR")
done

if [ "$DIR" = "/" ]; then
  exit 0
fi

cd "$DIR" || exit 0

# Detect and run test runner
if [ -f "package.json" ]; then
  HAS_TEST=$(jq -r '.scripts.test // empty' package.json 2>/dev/null)
  if [ -n "$HAS_TEST" ]; then
    npm test 2>&1
    TEST_EXIT=$?
    if [ $TEST_EXIT -ne 0 ]; then
      echo "Tests failed with exit code $TEST_EXIT" >&2
      exit 2
    fi
    exit 0
  fi
fi

if [ -f "composer.json" ]; then
  if [ -f "vendor/bin/pest" ]; then
    vendor/bin/pest 2>&1
  elif [ -f "vendor/bin/phpunit" ]; then
    vendor/bin/phpunit 2>&1
  else
    exit 0
  fi
  TEST_EXIT=$?
  if [ $TEST_EXIT -ne 0 ]; then
    echo "Tests failed with exit code $TEST_EXIT" >&2
    exit 2
  fi
fi

exit 0
`,
}
