import type { PresetDefinition } from '../types/index.js'
import { getBaseSections, BASE_DEFAULTS } from './base.js'

export const fastifyApiPreset: PresetDefinition = {
  name: 'fastify-api',
  displayName: 'Fastify REST API',
  description: 'Fastify with TypeScript, validation, and structured routes',
  sections: [
    ...getBaseSections().filter(s => s.sectionId !== 'responsive-design'),
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
  mcps: [],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: { ...BASE_DEFAULTS },
}
