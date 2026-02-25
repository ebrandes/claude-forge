import type { McpDefinition } from '../types/index.js'

export const githubMcp: McpDefinition = {
  name: 'github',
  displayName: 'GitHub',
  description: 'Enhanced GitHub integration for issues, PRs, and repos',
  serverCommand: 'npx',
  args: ['-y', '@anthropic/github-mcp-server'],
  requiresAuth: true,
  authType: 'token',
  authEnvVar: 'GITHUB_TOKEN',
  setupUrl: 'https://github.com/settings/tokens',
}
