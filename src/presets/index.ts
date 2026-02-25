import type { PresetDefinition } from '../types/index.js'
import { nextAppPreset } from './next-app.js'
import { fastifyApiPreset } from './fastify-api.js'
import { flutterAppPreset } from './flutter-app.js'
import { reactSpaPreset } from './react-spa.js'
import { nodeLibPreset } from './node-lib.js'
import { monorepoPreset } from './monorepo.js'
import { reactNativePreset } from './react-native.js'

const builtInPresets: PresetDefinition[] = [
  nextAppPreset,
  fastifyApiPreset,
  flutterAppPreset,
  reactSpaPreset,
  reactNativePreset,
  nodeLibPreset,
  monorepoPreset,
]

const presetMap = new Map<string, PresetDefinition>(
  builtInPresets.map(p => [p.name, p]),
)

export function getPresetByName(name: string): PresetDefinition | undefined {
  return presetMap.get(name)
}

export function listPresetNames(): string[] {
  return builtInPresets.map(p => p.name)
}

export function listPresets(): PresetDefinition[] {
  return [...builtInPresets]
}

export function registerPreset(preset: PresetDefinition): void {
  presetMap.set(preset.name, preset)
  builtInPresets.push(preset)
}
