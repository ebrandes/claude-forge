import { getBaseSections, BASE_DEFAULTS } from './base.js'

import type { PresetDefinition } from '../types/index.js'

export const reactNativePreset: PresetDefinition = {
  name: 'react-native',
  displayName: 'React Native / Expo',
  description: 'React Native with Expo, TypeScript, and mobile-first design',
  sections: [...getBaseSections().filter((s) => s.sectionId !== 'responsive-design')],
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
    maxLinesPerFile: 350,
    idealLineRange: [80, 220],
  },
}
