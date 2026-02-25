import { Command } from 'commander'
import { log } from '../utils/logger.js'
import { askForDescription, reviewGeneratedContent, askForAuthToken } from '../prompts/add-prompts.js'
import { generateMcpFromDescription, saveGeneratedMcp } from '../generators/ai-mcp.js'
import type { McpDefinition } from '../types/index.js'

export function addMcpCommand(): Command {
  return new Command('mcp')
    .description('Add an MCP server using AI')
    .option('-d, --description <text>', 'Description of the MCP integration')
    .action(async (options) => {
      const cwd = process.cwd()
      log.title('claude-forge add mcp')
      log.dim('AI-assisted MCP server configuration')
      log.blank()

      const description = options.description ?? await askForDescription('MCP server integration')

      log.step('Generating MCP configuration with AI...')
      let mcp: McpDefinition
      try {
        mcp = await generateMcpFromDescription(description)
      } catch (error) {
        log.error(`Generation failed: ${error instanceof Error ? error.message : error}`)
        process.exit(1)
      }

      const configPreview = JSON.stringify(mcp, null, 2)
      const review = await reviewGeneratedContent(`MCP: ${mcp.displayName}`, configPreview)

      if (!review.accepted) {
        log.warn('MCP configuration cancelled.')
        return
      }

      if (review.content !== configPreview) {
        try {
          mcp = JSON.parse(review.content) as McpDefinition
        } catch {
          log.error('Could not parse edited JSON. Using original configuration.')
        }
      }

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
