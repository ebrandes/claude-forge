import { getBaseSections, BASE_DEFAULTS } from './base.js'

import type { PresetDefinition } from '../types/index.js'

export const phpVitePreset: PresetDefinition = {
  name: 'php-vite',
  displayName: 'PHP + Vite (Full-Stack)',
  description: 'PHP backend + JS/TS frontend with hooks for both stacks',
  sections: [
    ...getBaseSections(),
    {
      sectionId: 'responsive-design',
      enabled: true,
      overrides: { responsiveMode: 'mobile-first' },
    },
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
    {
      name: 'TypeScript Check',
      event: 'PostToolUse',
      matcher: 'Edit|Write',
      templateId: 'check-ts',
      timeout: 30,
      required: true,
    },
    {
      name: 'ESLint Check',
      event: 'PostToolUse',
      matcher: 'Edit|Write',
      templateId: 'check-lint',
      timeout: 30,
      required: true,
    },
  ],
  mcps: [],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: { ...BASE_DEFAULTS },
}
