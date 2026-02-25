import { join } from 'node:path'
import { appendFile } from 'node:fs/promises'
import { writeTextFile, writeJsonFile, readJsonFile, fileExists } from '../utils/fs.js'
import { getMcpDefinition } from '../mcps/index.js'
import { log } from '../utils/logger.js'

interface SettingsLocal {
  mcpServers?: Record<string, McpServerEntry>
}

interface McpServerEntry {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export async function generateSettingsLocal(
  projectDir: string,
  enabledMcps: string[],
  collectedTokens: Record<string, string>,
): Promise<void> {
  const mcpServers: Record<string, McpServerEntry> = {}

  for (const mcpName of enabledMcps) {
    const definition = getMcpDefinition(mcpName)
    if (!definition) continue

    const entry: McpServerEntry = { command: definition.serverCommand }
    if (definition.args?.length) {
      entry.args = definition.args
    }

    if (definition.authEnvVar && collectedTokens[definition.authEnvVar]) {
      entry.env = { [definition.authEnvVar]: collectedTokens[definition.authEnvVar] }
    }

    mcpServers[mcpName] = entry
  }

  if (Object.keys(mcpServers).length === 0) return

  const settingsLocalPath = join(projectDir, '.claude', 'settings.local.json')
  const existing = await readJsonFile<SettingsLocal>(settingsLocalPath) ?? {}
  const merged: SettingsLocal = {
    ...existing,
    mcpServers: { ...existing.mcpServers, ...mcpServers },
  }

  await writeJsonFile(settingsLocalPath, merged)
  log.file('Created', '.claude/settings.local.json (MCP tokens)')
}

export async function generateEnvExample(
  projectDir: string,
  enabledMcps: string[],
): Promise<void> {
  const lines: string[] = [
    '# Tokens required for this project.',
    '# Configured automatically via: claude-forge init',
    '',
    '# Claude Code - API Key (required)',
    '# Get yours at: https://console.anthropic.com/settings/keys',
    '# → Added to ~/.zshrc by claude-forge init',
    'ANTHROPIC_API_KEY=',
  ]

  for (const mcpName of enabledMcps) {
    const definition = getMcpDefinition(mcpName)
    if (!definition?.requiresAuth || !definition.authEnvVar) continue

    lines.push('')
    lines.push(`# ${definition.displayName} (configured in .claude/settings.local.json)`)
    if (definition.setupUrl) {
      lines.push(`# Get yours at: ${definition.setupUrl}`)
    }
    lines.push(`${definition.authEnvVar}=`)
  }

  await writeTextFile(join(projectDir, '.env.example'), lines.join('\n') + '\n')
  log.file('Created', '.env.example (documentation)')
}

export async function addToShellProfile(
  envVar: string,
  value: string,
): Promise<boolean> {
  const zshrcPath = join(homedir(), '.zshrc')
  const exportLine = `\nexport ${envVar}="${value}"\n`

  try {
    await appendFile(zshrcPath, exportLine, 'utf-8')
    log.success(`Added ${envVar} to ~/.zshrc`)
    log.dim('  Run: source ~/.zshrc')
    return true
  } catch {
    log.warn(`Could not write to ~/.zshrc`)
    log.dim(`  Add manually: export ${envVar}="${value}"`)
    return false
  }
}

function homedir(): string {
  return process.env.HOME || process.env.USERPROFILE || '~'
}
