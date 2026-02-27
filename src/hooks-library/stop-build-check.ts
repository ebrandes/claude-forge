import type { HookTemplate } from './index.js'

export const stopBuildCheckHook: HookTemplate = {
  id: 'stop-build-check',
  name: 'Build Check on Stop',
  description: 'Run project build at the end of each AI response to catch compilation errors',
  event: 'Stop',
  matcher: '',
  timeout: 120,
  statusMessage: 'Running build check...',
  script: String.raw`#!/bin/bash

# Check if source files were modified in this session
CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|php|vue|svelte)$' | head -1)
if [ -z "$CHANGED" ]; then
  exit 0
fi

# Find project root
DIR=$(pwd)
while [ "$DIR" != "/" ]; do
  if [ -f "$DIR/package.json" ]; then
    break
  fi
  if [ -f "$DIR/composer.json" ]; then
    break
  fi
  DIR=$(dirname "$DIR")
done

if [ "$DIR" = "/" ]; then
  exit 0
fi

cd "$DIR" || exit 0

# Detect and run build
if [ -f "package.json" ]; then
  HAS_BUILD=$(jq -r '.scripts.build // empty' package.json 2>/dev/null)
  if [ -n "$HAS_BUILD" ]; then
    npm run build 2>&1
    BUILD_EXIT=$?
    if [ $BUILD_EXIT -ne 0 ]; then
      echo "Build failed with exit code $BUILD_EXIT" >&2
      exit 2
    fi
  fi
fi

exit 0
`,
}
