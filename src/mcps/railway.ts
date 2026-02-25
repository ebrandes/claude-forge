import type { McpDefinition } from '../types/index.js'

export const railwayMcp: McpDefinition = {
  name: 'railway',
  displayName: 'Railway',
  description: 'Deploy and manage Railway projects, check logs and status',
  serverCommand: 'npx',
  args: ['-y', '@anthropic/railway-mcp-server'],
  requiresAuth: true,
  authType: 'token',
  authEnvVar: 'RAILWAY_TOKEN',
  setupUrl: 'https://railway.com/account/tokens',
}
