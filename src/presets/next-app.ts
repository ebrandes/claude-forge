import type { PresetDefinition } from '../types/index.js'
import { getBaseSections, BASE_DEFAULTS } from './base.js'

export const nextAppPreset: PresetDefinition = {
  name: 'next-app',
  displayName: 'Next.js App Router',
  description: 'Next.js 14+ with App Router, Server Components, and Tailwind',
  sections: [
    ...getBaseSections(),
    { sectionId: 'responsive-design', enabled: true, overrides: { responsiveMode: 'mobile-first' } },
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
    { name: 'vercel', reason: 'Deploy and manage Vercel projects', requiresAuth: true, authType: 'token' },
    { name: 'supabase', reason: 'Manage Supabase database, auth, and storage', requiresAuth: true, authType: 'token' },
  ],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: { ...BASE_DEFAULTS },
}
