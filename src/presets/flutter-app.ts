import { getBaseSections, BASE_DEFAULTS } from './base.js'

import type { PresetDefinition } from '../types/index.js'

export const flutterAppPreset: PresetDefinition = {
  name: 'flutter-app',
  displayName: 'Flutter Mobile App',
  description: 'Flutter with Dart, BLoC/Riverpod, and clean architecture',
  sections: [
    ...getBaseSections().filter(
      (s) => s.sectionId !== 'responsive-design' && s.sectionId !== 'accessibility',
    ),
  ],
  hooks: [],
  mcps: [],
  settings: {
    permissions: { allow: ['Bash(xargs:*)'] },
  },
  defaults: {
    ...BASE_DEFAULTS,
    maxLinesPerFile: 300,
    idealLineRange: [80, 200],
  },
}
