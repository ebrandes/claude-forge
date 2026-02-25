import { input, select, checkbox, confirm, number, password } from '@inquirer/prompts'
import type { DetectedStack } from '../utils/detect-stack.js'
import { listPresets } from '../presets/index.js'
import { getAllHookTemplates } from '../hooks-library/index.js'
import { getAllMcpDefinitions, getMcpDefinition } from '../mcps/index.js'
import { getPresetByName } from '../presets/index.js'
import { getSavedToken } from '../core/credential-store.js'
import { log } from '../utils/logger.js'
import { basename } from 'node:path'

export interface InitAnswers {
  projectName: string
  projectDescription: string
  preset: string
  qualityLevel: 'strict' | 'moderate' | 'relaxed'
  maxLinesPerFile: number
  idealLineRange: [number, number]
  responsiveMode?: 'mobile-first' | 'desktop-first' | 'context-aware'
  mobileFirstRoutes?: string[]
  desktopFirstRoutes?: string[]
  enabledSections: string[]
  enabledHooks: string[]
  enabledMcps: string[]
  collectedTokens: Record<string, string>
  addApiKeyToZshrc: boolean
}

export async function askInitPrompts(
  detected: DetectedStack,
  availablePresets: string[],
): Promise<InitAnswers> {
  const collectedTokens: Record<string, string> = {}
  let addApiKeyToZshrc = false

  // ─── STEP 0: ANTHROPIC_API_KEY (must be first) ───
  log.title('API Key Setup')
  log.dim('The Anthropic API key is the foundation for all AI features.')
  log.blank()

  if (process.env.ANTHROPIC_API_KEY) {
    log.success('ANTHROPIC_API_KEY already configured')
  } else {
    const saved = await getSavedToken('ANTHROPIC_API_KEY')
    if (saved) {
      log.success('ANTHROPIC_API_KEY found in saved credentials')
      collectedTokens['ANTHROPIC_API_KEY'] = saved
    } else {
      log.warn('ANTHROPIC_API_KEY is not set.')
      log.dim('  Get one at: https://console.anthropic.com/settings/keys')
      const token = await password({ message: 'Paste token (or Enter to skip):' })
      if (token) {
        collectedTokens['ANTHROPIC_API_KEY'] = token
        addApiKeyToZshrc = await confirm({
          message: 'Add ANTHROPIC_API_KEY to ~/.zshrc?',
          default: true,
        })
      }
    }
  }
  log.blank()

  // ─── STEP 1: Project info ───
  const projectName = await input({
    message: 'Project name:',
    default: basename(process.cwd()),
  })

  const projectDescription = await input({
    message: 'Describe your project in a few words:',
  })

  const presets = listPresets()
  const presetName = await select({
    message: 'Select a preset:',
    choices: presets.map(p => ({
      name: `${p.displayName} — ${p.description}`,
      value: p.name,
    })),
    default: detected.presetSuggestion ?? 'next-app',
  })

  const preset = getPresetByName(presetName)!

  const qualityLevel = await select({
    message: 'Quality/Security level:',
    choices: [
      { name: 'strict — Max enforcement, all checks enabled', value: 'strict' as const },
      { name: 'moderate — Essential checks, core hooks', value: 'moderate' as const },
      { name: 'relaxed — Minimal checks, fewer restrictions', value: 'relaxed' as const },
    ],
    default: preset.defaults.qualityLevel,
  })

  const maxLinesPerFile = await number({
    message: 'Max lines per file:',
    default: preset.defaults.maxLinesPerFile,
    min: 100,
    max: 1000,
  }) ?? preset.defaults.maxLinesPerFile

  const isWebProject = ['next-app', 'react-spa'].includes(presetName)
  let responsiveMode: InitAnswers['responsiveMode']
  let mobileFirstRoutes: string[] | undefined
  let desktopFirstRoutes: string[] | undefined

  if (isWebProject) {
    responsiveMode = await select({
      message: 'Responsive design strategy:',
      choices: [
        { name: 'mobile-first — Mobile is the base, desktop enhances', value: 'mobile-first' as const },
        { name: 'desktop-first — Desktop is the base, mobile adapts', value: 'desktop-first' as const },
        { name: 'context-aware — Different routes have different priorities', value: 'context-aware' as const },
      ],
    })

    if (responsiveMode === 'context-aware') {
      const mobileInput = await input({
        message: 'Mobile-first routes (comma-separated):',
        default: '/field, /shop',
      })
      mobileFirstRoutes = mobileInput.split(',').map(r => r.trim()).filter(Boolean)

      const desktopInput = await input({
        message: 'Desktop-first routes (comma-separated):',
        default: '/admin, /dashboard',
      })
      desktopFirstRoutes = desktopInput.split(',').map(r => r.trim()).filter(Boolean)
    }
  }

  const sectionChoices = preset.sections.map(s => ({
    name: s.sectionId,
    value: s.sectionId,
    checked: s.enabled,
  }))

  const enabledSections = await checkbox({
    message: 'Sections to include in CLAUDE.md:',
    choices: sectionChoices,
  })

  const hookTemplates = getAllHookTemplates()
  const presetHookIds = preset.hooks.map(h => h.templateId)

  const enabledHooks = await checkbox({
    message: 'Hooks to include:',
    choices: hookTemplates.map(h => ({
      name: `${h.name} — ${h.description}`,
      value: h.id,
      checked: presetHookIds.includes(h.id),
    })),
  })

  const mcpDefinitions = getAllMcpDefinitions()
  const presetMcpNames = preset.mcps.map(m => m.name)

  const enabledMcps = await checkbox({
    message: 'MCP servers to configure:',
    choices: mcpDefinitions.map(m => ({
      name: `${m.displayName} — ${m.description}`,
      value: m.name,
      checked: presetMcpNames.includes(m.name),
    })),
  })

  // ─── MCP Token Collection ───
  log.blank()
  log.title('MCP Token Setup')
  for (const mcpName of enabledMcps) {
    const def = getMcpDefinition(mcpName)
    if (!def?.requiresAuth || !def.authEnvVar) continue

    if (process.env[def.authEnvVar]) {
      log.success(`${def.displayName}: ${def.authEnvVar} already configured`)
      continue
    }

    const saved = await getSavedToken(def.authEnvVar)
    if (saved) {
      log.success(`${def.displayName}: reusing saved token`)
      collectedTokens[def.authEnvVar] = saved
      continue
    }

    log.warn(`${def.displayName} requires a token.`)
    if (def.setupUrl) log.dim(`  Get one at: ${def.setupUrl}`)
    const token = await password({ message: `Paste ${def.authEnvVar} (or Enter to skip):` })
    if (token) {
      collectedTokens[def.authEnvVar] = token
    }
  }

  const idealMin = Math.round(maxLinesPerFile * 0.25)
  const idealMax = Math.round(maxLinesPerFile * 0.625)

  return {
    projectName,
    projectDescription,
    preset: presetName,
    qualityLevel,
    maxLinesPerFile,
    idealLineRange: [idealMin, idealMax],
    responsiveMode,
    mobileFirstRoutes,
    desktopFirstRoutes,
    enabledSections,
    enabledHooks,
    enabledMcps,
    collectedTokens,
    addApiKeyToZshrc,
  }
}
