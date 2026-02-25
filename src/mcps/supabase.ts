import type { McpDefinition } from '../types/index.js'

export const supabaseMcp: McpDefinition = {
  name: 'supabase',
  displayName: 'Supabase',
  description: 'Manage Supabase database, auth, and storage',
  serverCommand: 'npx',
  args: ['-y', 'supabase-mcp-server'],
  requiresAuth: true,
  authType: 'token',
  authEnvVar: 'SUPABASE_ACCESS_TOKEN',
  setupUrl: 'https://supabase.com/dashboard/account/tokens',
}
