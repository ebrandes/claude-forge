import type { HookTemplate } from './index.js'

export const promptContextReminderHook: HookTemplate = {
  id: 'prompt-context-reminder',
  name: 'Prompt Context Reminder',
  description: 'Inject project reminders on each user prompt submission',
  event: 'UserPromptSubmit',
  matcher: '',
  timeout: 5,
  statusMessage: 'Loading context...',
  script: String.raw`#!/bin/bash

# Customize these reminders for your project
REMINDERS="Max 400 lines/file. Performance first. Follow CLAUDE.md rules."

# Output to stdout — Claude sees this as context
echo "REMINDER: $REMINDERS"

exit 0
`,
}
