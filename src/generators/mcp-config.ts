import { join } from 'node:path'
import { readJsonFile, writeJsonFile } from '../utils/fs.js'
import { getMcpDefinition } from '../mcps/index.js'
import { checkMcpCredential, printCredentialSetup } from '../core/credential-store.js'
import { log } from '../utils/logger.js'

interface ClaudeSettings {
  permissions?: { allow?: string[] }
  hooks?: Record<string, unknown[]>
  mcpServers?: Record<string, McpServerConfig>
}

interface McpServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export async function generateMcpConfig(
  projectDir: string,
  enabledMcps: string[],
  existingSettings: ClaudeSettings,
): Promise<void> {
  if (enabledMcps.length === 0) return

  const mcpServers: Record<string, McpServerConfig> = {}

  for (const mcpName of enabledMcps) {
    const definition = getMcpDefinition(mcpName)
    if (!definition) {
      log.warn(`MCP definition not found: ${mcpName}`)
      continue
    }

    const hasCredential = checkMcpCredential(definition)
    if (!hasCredential) {
      printCredentialSetup(definition)
    } else {
      log.success(`${definition.displayName}: ${definition.authEnvVar} is set`)
    }

    const serverConfig: McpServerConfig = {
      command: definition.serverCommand,
    }
    if (definition.args?.length) {
      serverConfig.args = definition.args
    }
    if (definition.authEnvVar) {
      serverConfig.env = {
        [definition.authEnvVar]: `\${${definition.authEnvVar}}`,
      }
    }

    mcpServers[mcpName] = serverConfig
  }

  const settingsPath = join(projectDir, '.claude', 'settings.json')
  const merged: ClaudeSettings = { ...existingSettings, mcpServers }
  await writeJsonFile(settingsPath, merged)
  log.file('Updated', '.claude/settings.json (MCP servers added)')
}
