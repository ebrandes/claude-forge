import type { PresetDefinition } from '../types/index.js'
import { getHookTemplate } from '../hooks-library/index.js'

interface ClaudeSettings {
  permissions?: {
    allow?: string[]
  }
  hooks?: Record<string, HookEntry[]>
  mcpServers?: Record<string, McpServerSettings>
}

interface HookEntry {
  matcher: string
  hooks: HookCommand[]
}

interface HookCommand {
  type: string
  command: string
  timeout: number
  statusMessage?: string
}

interface McpServerSettings {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export function generateSettings(
  preset: PresetDefinition,
  enabledHooks: string[],
): ClaudeSettings {
  const settings: ClaudeSettings = {}

  if (preset.settings.permissions?.allow) {
    settings.permissions = { allow: [...preset.settings.permissions.allow] }
  }

  const hookEntries = buildHookEntries(enabledHooks)
  if (Object.keys(hookEntries).length > 0) {
    settings.hooks = hookEntries
  }

  return settings
}

function buildHookEntries(enabledHooks: string[]): Record<string, HookEntry[]> {
  const grouped = new Map<string, HookEntry>()

  for (const hookId of enabledHooks) {
    const template = getHookTemplate(hookId)
    if (!template) continue

    const key = `${template.event}:${template.matcher}`
    const existing = grouped.get(key)

    const hookCommand: HookCommand = {
      type: 'command',
      command: `bash .claude/hooks/${hookId}.sh`,
      timeout: template.timeout,
      statusMessage: template.statusMessage,
    }

    if (existing) {
      existing.hooks.push(hookCommand)
    } else {
      grouped.set(key, {
        matcher: template.matcher,
        hooks: [hookCommand],
      })
    }
  }

  const result: Record<string, HookEntry[]> = {}
  for (const [key, entry] of grouped) {
    const event = key.split(':')[0]
    if (!result[event]) result[event] = []
    result[event].push(entry)
  }

  return result
}
