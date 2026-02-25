import { Command } from 'commander'
import { log } from '../utils/logger.js'
import { askForDescription, reviewGeneratedContent } from '../prompts/add-prompts.js'
import { generateSkillFromDescription, saveGeneratedSkill } from '../generators/ai-skill.js'

export function addSkillCommand(): Command {
  return new Command('skill')
    .description('Generate a Claude Code skill (slash command) using AI')
    .argument('[description...]', 'Description of the skill to generate')
    .option('-d, --description <text>', 'Description of the skill to generate')
    .action(async (args: string[], options) => {
      const cwd = process.cwd()
      log.title('claude-forge add skill')
      log.dim('AI-assisted skill generation')
      log.blank()

      const inlineDescription = args.length > 0 ? args.join(' ') : null
      const description = inlineDescription ?? options.description ?? await askForDescription('skill (slash command)')

      log.step('Generating skill with AI...')
      let skill
      try {
        skill = await generateSkillFromDescription(description)
      } catch (error) {
        log.error(`Generation failed: ${error instanceof Error ? error.message : error}`)
        process.exit(1)
      }

      const review = await reviewGeneratedContent(`Skill: /${skill.name}`, skill.content)

      if (!review.accepted) {
        log.warn('Skill generation cancelled.')
        return
      }

      if (review.content !== skill.content) {
        skill = { ...skill, content: review.content }
      }

      await saveGeneratedSkill(cwd, skill)

      log.blank()
      log.success(`Skill "/${skill.name}" created successfully!`)
      log.dim(`  File: .claude/commands/${skill.name}.md`)
      log.dim(`  Use in Claude Code: /${skill.name}`)
    })
}
