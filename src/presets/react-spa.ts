import { getBaseSections, BASE_DEFAULTS } from './base.js'

import type { PresetDefinition } from '../types/index.js'

export const reactSpaPreset: PresetDefinition = {
  name: 'react-spa',
  displayName: 'React SPA',
  description: 'React SPA with Vite, TypeScript, and Tailwind',
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
      name: 'TypeScript Check',
      event: 'PostToolUse',
      matcher: 'Edit|Write',
      templateId: 'check-ts',
      timeout: 30,
      required: true,
    },
  ],
  mcps: [
    {
      name: 'vercel',
      reason: 'Deploy and manage Vercel projects',
      requiresAuth: true,
      authType: 'token',
    },
  ],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: { ...BASE_DEFAULTS },
}
