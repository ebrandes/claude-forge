import { input, select, checkbox } from '@inquirer/prompts'
import { listPresets } from '../presets/index.js'
import { getAllSections } from '../sections/index.js'
import { getAllHookTemplates } from '../hooks-library/index.js'
import { getAllMcpDefinitions } from '../mcps/index.js'

export interface PresetAnswers {
  name: string
  displayName: string
  description: string
  basePreset: string
  enabledSections: string[]
  enabledHooks: string[]
  enabledMcps: string[]
  maxLinesPerFile: number
  qualityLevel: 'strict' | 'moderate' | 'relaxed'
}

export async function askPresetPrompts(): Promise<PresetAnswers> {
  const name = await input({
    message: 'Preset slug (lowercase, dashes):',
    validate: (v) => /^[a-z0-9-]+$/.test(v) || 'Only lowercase letters, numbers, and dashes',
  })

  const displayName = await input({
    message: 'Display name:',
  })

  const description = await input({
    message: 'Short description:',
  })

  const presets = listPresets()
  const basePreset = await select({
    message: 'Base preset to extend:',
    choices: presets.map(p => ({
      name: `${p.displayName} — ${p.description}`,
      value: p.name,
    })),
  })

  const sections = getAllSections()
  const enabledSections = await checkbox({
    message: 'Sections to include:',
    choices: sections.map(s => ({
      name: `${s.emoji} ${s.title}`,
      value: s.id,
      checked: true,
    })),
  })

  const hooks = getAllHookTemplates()
  const enabledHooks = await checkbox({
    message: 'Hooks to include:',
    choices: hooks.map(h => ({
      name: `${h.name} — ${h.description}`,
      value: h.id,
    })),
  })

  const mcps = getAllMcpDefinitions()
  const enabledMcps = await checkbox({
    message: 'MCP servers:',
    choices: mcps.map(m => ({
      name: `${m.displayName} — ${m.description}`,
      value: m.name,
    })),
  })

  const qualityLevel = await select({
    message: 'Default quality level:',
    choices: [
      { name: 'strict', value: 'strict' as const },
      { name: 'moderate', value: 'moderate' as const },
      { name: 'relaxed', value: 'relaxed' as const },
    ],
  })

  return {
    name,
    displayName,
    description,
    basePreset,
    enabledSections,
    enabledHooks,
    enabledMcps,
    maxLinesPerFile: 400,
    qualityLevel,
  }
}
