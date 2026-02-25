import { Command } from 'commander'
import { log } from '../utils/logger.js'
import { askPresetPrompts } from '../prompts/preset-prompts.js'
import { getPresetByName, registerPreset } from '../presets/index.js'
import { GitHubSync } from '../core/github-sync.js'
import { ensureLoggedIn } from '../core/config.js'
import type { PresetDefinition } from '../types/index.js'

export function presetCommand(): Command {
  const cmd = new Command('preset')
    .description('Manage custom presets')

  cmd.command('create')
    .description('Create a new custom preset')
    .action(async () => {
      log.title('Create Custom Preset')

      await ensureLoggedIn()
      const answers = await askPresetPrompts()

      const basePreset = getPresetByName(answers.basePreset)
      if (!basePreset) {
        log.error(`Base preset "${answers.basePreset}" not found`)
        process.exit(1)
      }

      const newPreset: PresetDefinition = {
        name: answers.name,
        displayName: answers.displayName,
        description: answers.description,
        sections: basePreset.sections.map(s => ({
          ...s,
          enabled: answers.enabledSections.includes(s.sectionId),
        })),
        hooks: basePreset.hooks.filter(h =>
          answers.enabledHooks.includes(h.templateId),
        ),
        mcps: basePreset.mcps.filter(m =>
          answers.enabledMcps.includes(m.name),
        ),
        settings: { ...basePreset.settings },
        defaults: {
          maxLinesPerFile: answers.maxLinesPerFile,
          idealLineRange: [100, 250],
          qualityLevel: answers.qualityLevel,
        },
      }

      const sync = new GitHubSync()
      await sync.pull()
      await sync.writeFile(
        `presets/${answers.name}.json`,
        JSON.stringify(newPreset, null, 2),
      )
      await sync.commitAndPush(`preset: add ${answers.name}`)

      registerPreset(newPreset)

      log.blank()
      log.success(`Custom preset "${answers.name}" created and synced!`)
      log.dim('It will now appear in "claude-forge init" and "claude-forge list".')
    })

  return cmd
}
