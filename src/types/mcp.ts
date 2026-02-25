export interface McpDefinition {
  name: string
  displayName: string
  description: string
  serverCommand: string
  args?: string[]
  requiresAuth: boolean
  authType: 'api-key' | 'oauth' | 'ssh' | 'token'
  authEnvVar?: string
  setupUrl?: string
}

export interface McpRegistry {
  mcps: McpDefinition[]
}

export interface McpProjectConfig {
  mcpServers: Record<string, McpServerEntry>
}

export interface McpServerEntry {
  command: string
  args?: string[]
  env?: Record<string, string>
}
