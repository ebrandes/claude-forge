import { fastifyApiPreset } from './fastify-api.js'
import { flutterAppPreset } from './flutter-app.js'
import { monorepoPreset } from './monorepo.js'
import { nextAppPreset } from './next-app.js'
import { nodeLibPreset } from './node-lib.js'
import { phpApiPreset } from './php-api.js'
import { phpVitePreset } from './php-vite.js'
import { reactNativePreset } from './react-native.js'
import { reactSpaPreset } from './react-spa.js'

import type { PresetDefinition } from '../types/index.js'

const builtInPresets: PresetDefinition[] = [
  nextAppPreset,
  fastifyApiPreset,
  flutterAppPreset,
  reactSpaPreset,
  reactNativePreset,
  nodeLibPreset,
  phpApiPreset,
  phpVitePreset,
  monorepoPreset,
]

const presetMap = new Map<string, PresetDefinition>(builtInPresets.map((p) => [p.name, p]))

export function getPresetByName(name: string): PresetDefinition | undefined {
  return presetMap.get(name)
}

export function listPresetNames(): string[] {
  return builtInPresets.map((p) => p.name)
}

export function listPresets(): PresetDefinition[] {
  return [...builtInPresets]
}

export function registerPreset(preset: PresetDefinition): void {
  presetMap.set(preset.name, preset)
  builtInPresets.push(preset)
}
