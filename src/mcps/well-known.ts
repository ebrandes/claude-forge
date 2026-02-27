import type { McpDefinition } from '../types/index.js'

export interface WellKnownMcp extends McpDefinition {
  keywords: string[]
}

export const wellKnownMcps: WellKnownMcp[] = [
  // ─── Cloud & DevOps ───
  {
    name: 'azure-devops',
    displayName: 'Azure DevOps',
    description: 'Manage Azure DevOps repos, pipelines, work items, and boards',
    serverCommand: 'npx',
    args: ['-y', '@azure-devops/mcp'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'AZURE_DEVOPS_PAT',
    setupUrl: 'https://dev.azure.com/_usersSettings/tokens',
    keywords: ['azure', 'devops', 'azure-devops', 'ado', 'tfs', 'vsts'],
  },
  {
    name: 'aws-kb',
    displayName: 'AWS Knowledge Base',
    description: 'Retrieve and query AWS Knowledge Base documents',
    serverCommand: 'npx',
    args: ['-y', '@anthropic/aws-kb-retrieval-mcp-server'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'AWS_ACCESS_KEY_ID',
    setupUrl: 'https://console.aws.amazon.com/iam/',
    keywords: ['aws', 'amazon', 'knowledge-base', 'bedrock'],
  },
  {
    name: 'cloudflare',
    displayName: 'Cloudflare',
    description: 'Manage Cloudflare Workers, KV, R2, and DNS',
    serverCommand: 'npx',
    args: ['-y', '@cloudflare/mcp-server-cloudflare'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'CLOUDFLARE_API_TOKEN',
    setupUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    keywords: ['cloudflare', 'cf', 'workers', 'r2', 'kv'],
  },
  {
    name: 'firebase',
    displayName: 'Firebase',
    description: 'Manage Firebase projects, Firestore, Auth, and hosting',
    serverCommand: 'npx',
    args: ['-y', 'firebase-mcp'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'FIREBASE_TOKEN',
    setupUrl: 'https://console.firebase.google.com/',
    keywords: ['firebase', 'firestore', 'gcp', 'google-cloud'],
  },

  // ─── Database & ORM ───
  {
    name: 'prisma',
    displayName: 'Prisma',
    description: 'Database schema management, migrations, and Prisma Postgres',
    serverCommand: 'npx',
    args: ['-y', '@prisma/mcp-server'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['prisma', 'orm', 'database', 'db', 'schema'],
  },
  {
    name: 'postgres',
    displayName: 'PostgreSQL',
    description: 'Direct PostgreSQL database access and queries',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'POSTGRES_URL',
    keywords: ['postgres', 'postgresql', 'pg', 'sql'],
  },

  // ─── Testing & Automation ───
  {
    name: 'playwright',
    displayName: 'Playwright',
    description: 'Browser automation and E2E testing with Playwright',
    serverCommand: 'npx',
    args: ['-y', '@playwright/mcp'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['playwright', 'browser', 'e2e', 'testing', 'automation'],
  },
  {
    name: 'puppeteer',
    displayName: 'Puppeteer',
    description: 'Browser automation with Puppeteer for web scraping and testing',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['puppeteer', 'chrome', 'headless', 'scraping'],
  },

  // ─── Monitoring & Error Tracking ───
  {
    name: 'sentry',
    displayName: 'Sentry',
    description: 'Access Sentry issues, errors, and stack traces',
    serverCommand: 'npx',
    args: ['-y', '@sentry/mcp-server'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'SENTRY_AUTH_TOKEN',
    setupUrl: 'https://sentry.io/settings/account/api/auth-tokens/',
    keywords: ['sentry', 'errors', 'monitoring', 'crash', 'issues'],
  },

  // ─── Payments ───
  {
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Manage Stripe payments, customers, and subscriptions',
    serverCommand: 'npx',
    args: ['-y', '@stripe/mcp'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'STRIPE_SECRET_KEY',
    setupUrl: 'https://dashboard.stripe.com/apikeys',
    keywords: ['stripe', 'payments', 'billing', 'subscriptions'],
  },

  // ─── Productivity & Project Management ───
  {
    name: 'notion',
    displayName: 'Notion',
    description: 'Access and manage Notion pages, databases, and content',
    serverCommand: 'npx',
    args: ['-y', '@notionhq/notion-mcp-server'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'NOTION_API_KEY',
    setupUrl: 'https://www.notion.so/my-integrations',
    keywords: ['notion', 'wiki', 'docs', 'notes'],
  },
  {
    name: 'linear',
    displayName: 'Linear',
    description: 'Manage Linear issues, projects, and cycles',
    serverCommand: 'npx',
    args: ['-y', '@linear/mcp-server'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'LINEAR_API_KEY',
    setupUrl: 'https://linear.app/settings/api',
    keywords: ['linear', 'issues', 'project-management', 'tickets'],
  },
  {
    name: 'slack',
    displayName: 'Slack',
    description: 'Send and read Slack messages and channels',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'SLACK_BOT_TOKEN',
    setupUrl: 'https://api.slack.com/apps',
    keywords: ['slack', 'messaging', 'chat', 'channels'],
  },

  // ─── Search & Documentation ───
  {
    name: 'brave-search',
    displayName: 'Brave Search',
    description: 'Web search using Brave Search API',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    requiresAuth: true,
    authType: 'api-key',
    authEnvVar: 'BRAVE_API_KEY',
    setupUrl: 'https://brave.com/search/api/',
    keywords: ['brave', 'search', 'web-search'],
  },
  {
    name: 'context7',
    displayName: 'Context7',
    description: 'Up-to-date documentation for libraries and frameworks',
    serverCommand: 'npx',
    args: ['-y', '@upstash/context7-mcp'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['context7', 'docs', 'documentation', 'libraries'],
  },

  // ─── Utilities ───
  {
    name: 'filesystem',
    displayName: 'Filesystem',
    description: 'Secure file system access with configurable paths',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['filesystem', 'files', 'fs', 'directory'],
  },
  {
    name: 'docker',
    displayName: 'Docker',
    description: 'Manage Docker containers, images, and compose stacks',
    serverCommand: 'npx',
    args: ['-y', 'mcp-server-docker'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['docker', 'containers', 'compose', 'devcontainer'],
  },
  {
    name: 'fetch',
    displayName: 'Web Fetch',
    description: 'Fetch and process web content from URLs',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['fetch', 'http', 'web', 'url', 'api'],
  },
  {
    name: 'memory',
    displayName: 'Memory',
    description: 'Persistent memory for storing knowledge graphs',
    serverCommand: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    requiresAuth: false,
    authType: 'token',
    keywords: ['memory', 'knowledge', 'graph', 'persistent'],
  },
  {
    name: 'figma',
    displayName: 'Figma',
    description: 'Access Figma designs, components, and design tokens',
    serverCommand: 'npx',
    args: ['-y', '@anthropic/figma-mcp-server'],
    requiresAuth: true,
    authType: 'token',
    authEnvVar: 'FIGMA_ACCESS_TOKEN',
    setupUrl: 'https://www.figma.com/developers/api#access-tokens',
    keywords: ['figma', 'design', 'ui', 'components'],
  },
]

export function findMatchingMcp(query: string): WellKnownMcp | null {
  const normalized = query.toLowerCase().trim()

  // Exact name match
  const exactMatch = wellKnownMcps.find((m) => m.name === normalized)
  if (exactMatch) return exactMatch

  // Keyword match
  const keywordMatch = wellKnownMcps.find((m) => m.keywords.includes(normalized))
  if (keywordMatch) return keywordMatch

  // Partial match on name, displayName, or keywords
  const partialMatch = wellKnownMcps.find(
    (m) =>
      m.name.includes(normalized) ||
      m.displayName.toLowerCase().includes(normalized) ||
      m.keywords.some((k) => k.includes(normalized) || normalized.includes(k)),
  )
  if (partialMatch) return partialMatch

  return null
}

export function listWellKnownMcps(): WellKnownMcp[] {
  return [...wellKnownMcps]
}
