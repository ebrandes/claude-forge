import type { HookConfig, SectionConfig } from '../types/index.js'

export function getSecurityHooks(): HookConfig[] {
  return [
    {
      name: 'Protect Sensitive Files',
      event: 'PreToolUse',
      matcher: 'Edit|Write|Read',
      templateId: 'protect-sensitive-files',
      timeout: 5,
      required: false,
    },
    {
      name: 'Protect Main Branch',
      event: 'PreToolUse',
      matcher: 'Bash',
      templateId: 'protect-main-branch',
      timeout: 5,
      required: false,
    },
  ]
}

export function getBaseSections(): SectionConfig[] {
  return [
    { sectionId: 'core-principles', enabled: true },
    { sectionId: 'file-size-rules', enabled: true },
    { sectionId: 'performance', enabled: true },
    { sectionId: 'architecture', enabled: true },
    { sectionId: 'state-management', enabled: true },
    { sectionId: 'components-functions', enabled: true },
    { sectionId: 'naming-conventions', enabled: true },
    { sectionId: 'bug-prevention', enabled: true },
    { sectionId: 'testing', enabled: true },
    { sectionId: 'error-handling', enabled: true },
    { sectionId: 'code-style', enabled: true },
    { sectionId: 'accessibility', enabled: true },
    { sectionId: 'implementation-protocol', enabled: true },
    { sectionId: 'ai-interaction', enabled: true },
    { sectionId: 'avoid-list', enabled: true },
  ]
}

export const BASE_DEFAULTS = {
  maxLinesPerFile: 400,
  idealLineRange: [100, 250] as [number, number],
  qualityLevel: 'strict' as const,
}
