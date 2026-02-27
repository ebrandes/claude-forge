import { checkBuildHook } from './check-build.js'
import { checkLintStagedHook } from './check-lint-staged.js'
import { checkLintHook } from './check-lint.js'
import { checkPhpLintHook } from './check-php-lint.js'
import { checkPhpSyntaxHook } from './check-php-syntax.js'
import { checkPhpTestsHook } from './check-php-tests.js'
import { checkTestsHook } from './check-tests.js'
import { checkTsHook } from './check-ts.js'
import { promptContextReminderHook } from './prompt-context-reminder.js'
import { protectMainBranchHook } from './protect-main-branch.js'
import { protectSensitiveFilesHook } from './protect-sensitive-files.js'
import { stopBuildCheckHook } from './stop-build-check.js'
import { stopTestCheckHook } from './stop-test-check.js'

import type { HookEvent } from '../types/preset.js'

export interface HookTemplate {
  id: string
  name: string
  description: string
  event: HookEvent
  matcher: string
  timeout: number
  statusMessage: string
  script: string
}

const hookTemplates: HookTemplate[] = [
  checkTsHook,
  checkLintHook,
  checkLintStagedHook,
  checkBuildHook,
  checkTestsHook,
  checkPhpSyntaxHook,
  checkPhpLintHook,
  checkPhpTestsHook,
  protectSensitiveFilesHook,
  protectMainBranchHook,
  stopBuildCheckHook,
  stopTestCheckHook,
  promptContextReminderHook,
]

const hookMap = new Map<string, HookTemplate>(hookTemplates.map((h) => [h.id, h]))

export function getHookTemplate(id: string): HookTemplate | undefined {
  return hookMap.get(id)
}

export function getAllHookTemplates(): HookTemplate[] {
  return [...hookTemplates]
}

export function getHookIds(): string[] {
  return hookTemplates.map((h) => h.id)
}
