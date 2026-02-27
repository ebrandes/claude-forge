import { Command } from 'commander'

import { generateAgentFromDescription, saveGeneratedAgent } from '../generators/ai-agent.js'
import { askForDescription, reviewGeneratedContent } from '../prompts/add-prompts.js'
import { log } from '../utils/logger.js'

export function addAgentCommand(): Command {
  return new Command('agent')
    .description('Generate a Claude Code agent definition using AI')
    .argument('[description...]', 'Description of the agent to generate')
    .option('-d, --description <text>', 'Description of the agent to generate')
    .action(async (args: string[], options: { description?: string }) => {
      const cwd = process.cwd()
      log.title('claude-forge add agent')
      log.dim('AI-assisted agent generation')
      log.blank()

      const inlineDescription = args.length > 0 ? args.join(' ') : null
      const description =
        inlineDescription ?? options.description ?? (await askForDescription('agent'))

      log.step('Generating agent with AI...')
      let agent
      try {
        agent = await generateAgentFromDescription(description)
      } catch (error: unknown) {
        log.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }

      const review = await reviewGeneratedContent(`Agent: ${agent.displayName}`, agent.content)

      if (!review.accepted) {
        log.warn('Agent generation cancelled.')
        return
      }

      if (review.content !== agent.content) {
        agent = { ...agent, content: review.content }
      }

      await saveGeneratedAgent(cwd, agent)

      log.blank()
      log.success(`Agent "${agent.displayName}" created successfully!`)
      log.dim(`  File: .claude/agents/${agent.name}.md`)
    })
}
