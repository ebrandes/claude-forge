import path from 'node:path'

import { readJsonFile, writeJsonFile, getForgeDir } from '../utils/fs.js'
import { log } from '../utils/logger.js'

import type { McpDefinition, CredentialCache } from '../types/index.js'

function getCredentialsPath(): string {
  return path.join(getForgeDir(), 'credentials.json')
}

export async function loadCredentials(): Promise<CredentialCache | null> {
  return readJsonFile<CredentialCache>(getCredentialsPath())
}

export async function saveCredentials(tokens: Record<string, string>): Promise<void> {
  const existing = await loadCredentials()
  const merged: CredentialCache = {
    tokens: { ...existing?.tokens, ...tokens },
    updatedAt: new Date().toISOString(),
  }
  await writeJsonFile(getCredentialsPath(), merged)
}

export async function getSavedToken(envVar: string): Promise<string | null> {
  const cache = await loadCredentials()
  return cache?.tokens[envVar] ?? null
}

export function checkMcpCredential(mcp: McpDefinition): boolean {
  if (!mcp.requiresAuth || !mcp.authEnvVar) return true
  return process.env[mcp.authEnvVar] !== undefined
}

export function printCredentialSetup(mcp: McpDefinition): void {
  if (!mcp.authEnvVar) return

  log.warn(`${mcp.displayName} requires authentication.`)

  if (mcp.setupUrl) {
    log.dim(`  Get your token at: ${mcp.setupUrl}`)
  }

  log.dim(`  Add to your shell profile (~/.zshrc or ~/.bashrc):`)
  log.dim(`    export ${mcp.authEnvVar}="your-token-here"`)
  log.blank()
}

export function getCredentialStatus(mcp: McpDefinition): string {
  if (!mcp.requiresAuth) return 'no auth required'
  if (!mcp.authEnvVar) return 'unknown'

  return process.env[mcp.authEnvVar] ? `${mcp.authEnvVar} is set` : `${mcp.authEnvVar} is NOT set`
}
