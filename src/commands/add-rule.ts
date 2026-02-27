import { Command } from 'commander'

import { generateRuleFromDescription, saveGeneratedRule } from '../generators/ai-rule.js'
import { askForDescription, reviewGeneratedContent } from '../prompts/add-prompts.js'
import { log } from '../utils/logger.js'

export function addRuleCommand(): Command {
  return new Command('rule')
    .description('Generate a Claude Code rule using AI')
    .argument('[description...]', 'Description of the rule to generate')
    .option('-d, --description <text>', 'Description of the rule to generate')
    .action(async (args: string[], options: { description?: string }) => {
      const cwd = process.cwd()
      log.title('claude-forge add rule')
      log.dim('AI-assisted rule generation')
      log.blank()

      const inlineDescription = args.length > 0 ? args.join(' ') : null
      const description =
        inlineDescription ?? options.description ?? (await askForDescription('rule'))

      log.step('Generating rule with AI...')
      let rule
      try {
        rule = await generateRuleFromDescription(description)
      } catch (error: unknown) {
        log.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }

      const review = await reviewGeneratedContent(`Rule: ${rule.displayName}`, rule.content)

      if (!review.accepted) {
        log.warn('Rule generation cancelled.')
        return
      }

      if (review.content !== rule.content) {
        rule = { ...rule, content: review.content }
      }

      await saveGeneratedRule(cwd, rule)

      log.blank()
      log.success(`Rule "${rule.displayName}" created successfully!`)
      log.dim(`  File: .claude/rules/${rule.name}.md`)
      if (rule.scope) {
        log.dim(`  Scope: ${rule.scope}`)
      }
    })
}
