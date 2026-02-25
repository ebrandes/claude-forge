import type { PresetDefinition } from '../types/index.js'
import { getBaseSections, BASE_DEFAULTS } from './base.js'

export const nodeLibPreset: PresetDefinition = {
  name: 'node-lib',
  displayName: 'Node.js Library',
  description: 'Node.js library with TypeScript, tests, and npm publishing',
  sections: [
    ...getBaseSections().filter(s =>
      s.sectionId !== 'responsive-design' &&
      s.sectionId !== 'state-management' &&
      s.sectionId !== 'accessibility',
    ),
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
  defaults: {
    ...BASE_DEFAULTS,
    maxLinesPerFile: 300,
    idealLineRange: [50, 200],
  },
}
