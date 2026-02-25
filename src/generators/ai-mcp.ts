import { join } from 'node:path'
import type { McpDefinition, McpServerEntry, ForgeProjectManifest } from '../types/index.js'
import { generateWithClaude } from '../core/anthropic-client.js'
import { buildMcpSystemPrompt, buildMcpUserPrompt } from '../ai/prompt-templates.js'
import { readJsonFile, writeJsonFile } from '../utils/fs.js'
import { saveCredentials } from '../core/credential-store.js'
import { log } from '../utils/logger.js'

export async function generateMcpFromDescription(description: string): Promise<McpDefinition> {
  const result = await generateWithClaude(
    buildMcpSystemPrompt(),
    buildMcpUserPrompt(description),
  )

  log.dim(`  (${result.inputTokens} in / ${result.outputTokens} out tokens)`)
  return parseMcpResponse(result.content)
}

function parseMcpResponse(raw: string): McpDefinition {
  const cleaned = raw.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim()

  const parsed = JSON.parse(cleaned)
  validateMcpDefinition(parsed)
  return parsed as McpDefinition
}

function validateMcpDefinition(obj: unknown): asserts obj is McpDefinition {
  const mcp = obj as Record<string, unknown>
  const required = ['name', 'displayName', 'description', 'serverCommand', 'requiresAuth', 'authType']
  for (const field of required) {
    if (mcp[field] === undefined) throw new Error(`Missing required field: ${field}`)
  }
}

export async function saveGeneratedMcp(
  projectDir: string,
  mcp: McpDefinition,
  authToken?: string | null,
): Promise<void> {
  await registerMcpInSettings(projectDir, mcp)

  if (authToken && mcp.authEnvVar) {
    await saveMcpToken(projectDir, mcp, authToken)
    await saveCredentials({ [mcp.authEnvVar]: authToken })
  }

  await updateManifestMcps(projectDir, mcp.name)
}

async function registerMcpInSettings(projectDir: string, mcp: McpDefinition): Promise<void> {
  const settingsPath = join(projectDir, '.claude', 'settings.json')
  const settings = await readJsonFile<Record<string, unknown>>(settingsPath) ?? {}

  const mcpServers = (settings.mcpServers ?? {}) as Record<string, McpServerEntry>

  const entry: McpServerEntry = { command: mcp.serverCommand }
  if (mcp.args?.length) entry.args = mcp.args
  if (mcp.authEnvVar) {
    entry.env = { [mcp.authEnvVar]: `\${${mcp.authEnvVar}}` }
  }

  mcpServers[mcp.name] = entry
  settings.mcpServers = mcpServers
  await writeJsonFile(settingsPath, settings)
  log.file('Updated', '.claude/settings.json')
}

async function saveMcpToken(
  projectDir: string,
  mcp: McpDefinition,
  token: string,
): Promise<void> {
  const localPath = join(projectDir, '.claude', 'settings.local.json')
  const local = await readJsonFile<Record<string, unknown>>(localPath) ?? {}
  const mcpServers = (local.mcpServers ?? {}) as Record<string, McpServerEntry>

  mcpServers[mcp.name] = {
    command: mcp.serverCommand,
    ...(mcp.args?.length ? { args: mcp.args } : {}),
    env: { [mcp.authEnvVar!]: token },
  }

  local.mcpServers = mcpServers
  await writeJsonFile(localPath, local)
  log.file('Updated', '.claude/settings.local.json')
}

async function updateManifestMcps(projectDir: string, mcpName: string): Promise<void> {
  const manifestPath = join(projectDir, '.claude-forge.json')
  const manifest = await readJsonFile<ForgeProjectManifest>(manifestPath)
  if (!manifest) return

  if (!manifest.mcps.includes(mcpName)) {
    manifest.mcps.push(mcpName)
  }

  await writeJsonFile(manifestPath, manifest)
  log.file('Updated', '.claude-forge.json')
}
