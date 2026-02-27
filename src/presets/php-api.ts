import { getBaseSections } from './base.js'

import type { PresetDefinition } from '../types/index.js'

export const phpApiPreset: PresetDefinition = {
  name: 'php-api',
  displayName: 'PHP API (Laravel / Symfony / Generic)',
  description: 'PHP backend with auto-detected tools (PHPStan, Pint, Pest, PHPUnit)',
  sections: [
    ...getBaseSections().filter(
      (s) =>
        s.sectionId !== 'responsive-design' &&
        s.sectionId !== 'state-management' &&
        s.sectionId !== 'components-functions' &&
        s.sectionId !== 'accessibility',
    ),
  ],
  hooks: [
    {
      name: 'PHP Syntax Check',
      event: 'PostToolUse',
      matcher: 'Edit|Write',
      templateId: 'check-php-syntax',
      timeout: 15,
      required: true,
    },
    {
      name: 'PHP Lint & Analysis',
      event: 'PostToolUse',
      matcher: 'Edit|Write',
      templateId: 'check-php-lint',
      timeout: 30,
      required: true,
    },
    {
      name: 'PHP Related Tests',
      event: 'PostToolUse',
      matcher: 'Edit|Write',
      templateId: 'check-php-tests',
      timeout: 60,
      required: false,
    },
  ],
  mcps: [],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: {
    maxLinesPerFile: 300,
    idealLineRange: [80, 200],
    qualityLevel: 'strict',
  },
}
