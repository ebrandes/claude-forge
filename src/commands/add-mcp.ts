import { confirm } from '@inquirer/prompts'
import { Command } from 'commander'

import { generateMcpFromDescription, saveGeneratedMcp } from '../generators/ai-mcp.js'
import { findMatchingMcp } from '../mcps/well-known.js'
import {
  askForDescription,
  reviewGeneratedContent,
  askForAuthToken,
} from '../prompts/add-prompts.js'
import { log } from '../utils/logger.js'

import type { McpDefinition } from '../types/index.js'

export function addMcpCommand(): Command {
  return new Command('mcp')
    .description('Add an MCP server (auto-detects known servers, falls back to AI)')
    .argument('[description...]', 'Description or name of the MCP integration')
    .option('-d, --description <text>', 'Description of the MCP integration')
    .action(async (args: string[], options: { description?: string }) => {
      const cwd = process.cwd()
      log.title('claude-forge add mcp')
      log.blank()

      const inlineDescription = args.length > 0 ? args.join(' ') : null
      const description =
        inlineDescription ??
        options.description ??
        (await askForDescription('MCP server name or description'))

      // Try to match against well-known MCPs first
      const knownMcp = findMatchingMcp(description)
      const mcp: McpDefinition = knownMcp
        ? await handleKnownMcp(knownMcp)
        : await handleAiGeneration(description)

      let authToken: string | null = null
      if (mcp.requiresAuth && mcp.authEnvVar) {
        authToken = await askForAuthToken(mcp.authEnvVar, mcp.setupUrl)
      }

      await saveGeneratedMcp(cwd, mcp, authToken)

      log.blank()
      log.success(`MCP "${mcp.displayName}" configured successfully!`)
      log.dim(`  Command: ${mcp.serverCommand} ${mcp.args?.join(' ') ?? ''}`)
      if (mcp.authEnvVar) {
        log.dim(`  Auth: ${mcp.authEnvVar}${authToken ? ' (saved)' : ' (not provided)'}`)
      }
    })
}

async function handleKnownMcp(knownMcp: McpDefinition): Promise<McpDefinition> {
  log.success(`Found: ${knownMcp.displayName}`)
  log.dim(`  ${knownMcp.description}`)
  log.dim(`  Package: ${knownMcp.serverCommand} ${knownMcp.args?.join(' ') ?? ''}`)
  log.blank()

  const useIt = await confirm({
    message: `Add "${knownMcp.displayName}" MCP server?`,
    default: true,
  })

  if (!useIt) {
    log.warn('Cancelled.')
    process.exit(0)
  }

  return knownMcp
}

async function handleAiGeneration(description: string): Promise<McpDefinition> {
  log.dim('No known MCP matched — generating with AI...')
  log.blank()

  let mcp: McpDefinition
  try {
    mcp = await generateMcpFromDescription(description)
  } catch (error: unknown) {
    log.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  const configPreview = JSON.stringify(mcp, null, 2)
  const review = await reviewGeneratedContent(`MCP: ${mcp.displayName}`, configPreview)

  if (!review.accepted) {
    log.warn('MCP configuration cancelled.')
    process.exit(0)
  }

  if (review.content !== configPreview) {
    try {
      mcp = JSON.parse(review.content) as McpDefinition
    } catch {
      log.error('Could not parse edited JSON. Using original configuration.')
    }
  }

  return mcp
}
