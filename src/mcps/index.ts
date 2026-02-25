import type { McpDefinition } from '../types/index.js'
import { vercelMcp } from './vercel.js'
import { supabaseMcp } from './supabase.js'
import { githubMcp } from './github.js'
import { railwayMcp } from './railway.js'

const builtInMcps: McpDefinition[] = [
  vercelMcp,
  supabaseMcp,
  githubMcp,
  railwayMcp,
]

const mcpMap = new Map<string, McpDefinition>(
  builtInMcps.map(m => [m.name, m]),
)

export function getMcpDefinition(name: string): McpDefinition | undefined {
  return mcpMap.get(name)
}

export function getAllMcpDefinitions(): McpDefinition[] {
  return [...builtInMcps]
}

export function getMcpNames(): string[] {
  return builtInMcps.map(m => m.name)
}

export function registerMcp(mcp: McpDefinition): void {
  mcpMap.set(mcp.name, mcp)
  builtInMcps.push(mcp)
}
