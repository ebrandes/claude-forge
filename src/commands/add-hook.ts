import { Command } from 'commander'

import { generateHookFromDescription, saveGeneratedHook } from '../generators/ai-hook.js'
import { askForDescription, reviewGeneratedContent } from '../prompts/add-prompts.js'
import { log } from '../utils/logger.js'

export function addHookCommand(): Command {
  return new Command('hook')
    .description('Generate a Claude Code hook using AI')
    .argument('[description...]', 'Description of the hook to generate')
    .option('-d, --description <text>', 'Description of the hook to generate')
    .action(async (args: string[], options: { description?: string }) => {
      const cwd = process.cwd()
      log.title('claude-forge add hook')
      log.dim('AI-assisted hook generation')
      log.blank()

      const inlineDescription = args.length > 0 ? args.join(' ') : null
      const description =
        inlineDescription ?? options.description ?? (await askForDescription('hook'))

      log.step('Generating hook with AI...')
      let hook
      try {
        hook = await generateHookFromDescription(description)
      } catch (error: unknown) {
        log.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }

      const review = await reviewGeneratedContent(`Hook: ${hook.name}`, hook.script)

      if (!review.accepted) {
        log.warn('Hook generation cancelled.')
        return
      }

      if (review.content !== hook.script) {
        hook = { ...hook, script: review.content }
      }

      await saveGeneratedHook(cwd, hook)

      log.blank()
      log.success(`Hook "${hook.name}" created successfully!`)
      log.dim(`  Event: ${hook.event}, Matcher: ${hook.matcher}`)
      log.dim(`  File: .claude/hooks/${hook.id}.sh`)
    })
}
