import type { HookTemplate } from './index.js'

export const protectMainBranchHook: HookTemplate = {
  id: 'protect-main-branch',
  name: 'Protect Main Branch',
  description: 'Block destructive git commands on main/master branches',
  event: 'PreToolUse',
  matcher: 'Bash',
  timeout: 5,
  statusMessage: 'Checking git command safety...',
  script: String.raw`#!/bin/bash
INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block force push to any branch
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force'; then
  echo "Blocked: git push --force is not allowed" >&2
  exit 2
fi

# Block push directly to main/master
if echo "$COMMAND" | grep -qE 'git\s+push\s+\S+\s+(main|master)\b'; then
  echo "Blocked: direct push to main/master is not allowed" >&2
  exit 2
fi

# Block destructive reset
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo "Blocked: git reset --hard is not allowed" >&2
  exit 2
fi

# Block checkout that discards all changes
if echo "$COMMAND" | grep -qE 'git\s+checkout\s+\.$'; then
  echo "Blocked: git checkout . discards all changes" >&2
  exit 2
fi

# Block clean -f (force delete untracked files)
if echo "$COMMAND" | grep -qE 'git\s+clean\s+-[a-zA-Z]*f'; then
  echo "Blocked: git clean -f is not allowed" >&2
  exit 2
fi

exit 0
`,
}
