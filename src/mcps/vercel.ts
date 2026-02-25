import type { McpDefinition } from '../types/index.js'

export const vercelMcp: McpDefinition = {
  name: 'vercel',
  displayName: 'Vercel',
  description: 'Deploy and manage Vercel projects, check deployments and logs',
  serverCommand: 'npx',
  args: ['-y', 'vercel-mcp-server'],
  requiresAuth: true,
  authType: 'token',
  authEnvVar: 'VERCEL_TOKEN',
  setupUrl: 'https://vercel.com/account/tokens',
}
