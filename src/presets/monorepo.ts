import type { PresetDefinition } from '../types/index.js'
import { getBaseSections, BASE_DEFAULTS } from './base.js'

export const monorepoPreset: PresetDefinition = {
  name: 'monorepo',
  displayName: 'Monorepo',
  description: 'Monorepo with workspaces (pnpm/npm/yarn), shared configs',
  sections: [
    ...getBaseSections(),
    { sectionId: 'responsive-design', enabled: false },
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
    { name: 'supabase', reason: 'Manage Supabase database, auth, and migrations', requiresAuth: true, authType: 'token' },
    { name: 'vercel', reason: 'Deploy and manage Vercel projects', requiresAuth: true, authType: 'token' },
  ],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: { ...BASE_DEFAULTS },
}
