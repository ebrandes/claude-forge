import path from 'node:path'

import { buildHookSystemPrompt, buildHookUserPrompt } from '../ai/prompt-templates.js'
import { generateWithClaude } from '../core/anthropic-client.js'
import { VALID_HOOK_EVENTS } from '../types/preset.js'
import { writeTextFile, readJsonFile, writeJsonFile, ensureDir } from '../utils/fs.js'
import { log } from '../utils/logger.js'

import type { HookTemplate } from '../hooks-library/index.js'
import type { ForgeProjectManifest } from '../types/index.js'

export async function generateHookFromDescription(description: string): Promise<HookTemplate> {
  const result = await generateWithClaude(buildHookSystemPrompt(), buildHookUserPrompt(description))

  log.dim(`  (${result.inputTokens} in / ${result.outputTokens} out tokens)`)
  return parseHookResponse(result.content)
}

function parseHookResponse(raw: string): HookTemplate {
  const cleaned = raw
    .replaceAll(/^```(?:json)?\n?/gm, '')
    .replaceAll(/\n?```$/gm, '')
    .trim()

  const parsed: unknown = JSON.parse(cleaned)
  validateHookTemplate(parsed)
  return parsed
}

function validateHookTemplate(obj: unknown): asserts obj is HookTemplate {
  const hook = obj as Record<string, unknown>
  const required = [
    'id',
    'name',
    'description',
    'event',
    'matcher',
    'timeout',
    'statusMessage',
    'script',
  ]
  for (const field of required) {
    if (!hook[field]) throw new Error(`Missing required field: ${field}`)
  }
  if (!VALID_HOOK_EVENTS.includes(hook.event as (typeof VALID_HOOK_EVENTS)[number])) {
    throw new Error(
      `Invalid event: ${String(hook.event)}. Must be one of: ${VALID_HOOK_EVENTS.join(', ')}`,
    )
  }
  if (typeof hook.timeout !== 'number') {
    throw new TypeError('timeout must be a number')
  }
}

export async function saveGeneratedHook(projectDir: string, hook: HookTemplate): Promise<void> {
  const hooksDir = path.join(projectDir, '.claude', 'hooks')
  await ensureDir(hooksDir)

  const hookPath = path.join(hooksDir, `${hook.id}.sh`)
  await writeTextFile(hookPath, hook.script)
  log.file('Created', `.claude/hooks/${hook.id}.sh`)

  await registerHookInSettings(projectDir, hook)
  await updateManifestHooks(projectDir, hook.id)
}

interface HookCommand {
  type: string
  command: string
  timeout: number
  statusMessage: string
}

interface HookEntry {
  matcher: string
  hooks: HookCommand[]
}

async function registerHookInSettings(projectDir: string, hook: HookTemplate): Promise<void> {
  const settingsPath = path.join(projectDir, '.claude', 'settings.json')
  const settings = (await readJsonFile<Record<string, unknown>>(settingsPath)) ?? {}

  const hooks = (settings.hooks ?? {}) as Record<string, HookEntry[]>
  const eventHooks = hooks[hook.event] ?? []

  const hookCommand: HookCommand = {
    type: 'command',
    command: `bash .claude/hooks/${hook.id}.sh`,
    timeout: hook.timeout,
    statusMessage: hook.statusMessage,
  }

  const existingEntry = eventHooks.find((e) => e.matcher === hook.matcher)
  if (existingEntry) {
    existingEntry.hooks.push(hookCommand)
  } else {
    eventHooks.push({ matcher: hook.matcher, hooks: [hookCommand] })
  }

  hooks[hook.event] = eventHooks
  settings.hooks = hooks
  await writeJsonFile(settingsPath, settings)
  log.file('Updated', '.claude/settings.json')
}

async function updateManifestHooks(projectDir: string, hookId: string): Promise<void> {
  const manifestPath = path.join(projectDir, '.claude-forge.json')
  const manifest = await readJsonFile<ForgeProjectManifest>(manifestPath)
  if (!manifest) return

  if (!manifest.hooks.includes(hookId)) {
    manifest.hooks.push(hookId)
  }
  const hookFile = `.claude/hooks/${hookId}.sh`
  if (!manifest.managedFiles.includes(hookFile)) {
    manifest.managedFiles.push(hookFile)
  }

  await writeJsonFile(manifestPath, manifest)
  log.file('Updated', '.claude-forge.json')
}
