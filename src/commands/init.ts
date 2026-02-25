import { Command } from 'commander'
import { log } from '../utils/logger.js'
import { detectStack } from '../utils/detect-stack.js'
import { getPresetByName } from '../presets/index.js'
import { generateClaudeMd } from '../generators/claude-md.js'
import { generateSettings } from '../generators/settings.js'
import { generateHooks } from '../generators/hooks.js'
import { generateSettingsLocal, generateEnvExample, addToShellProfile } from '../generators/env-file.js'
import { writeTextFile, writeJsonFile } from '../utils/fs.js'
import { saveCredentials } from '../core/credential-store.js'
import { askInitPrompts } from '../prompts/init-prompts.js'
import { join } from 'node:path'
import type { ForgeProjectManifest } from '../types/index.js'

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize Claude Code configuration for the current project')
    .option('--preset <name>', 'Use a specific preset directly')
    .option('--no-sync', 'Skip syncing from remote repo')
    .action(async () => {
      const cwd = process.cwd()
      log.title('claude-forge init')

      const detected = await detectStack(cwd)
      if (detected.framework) {
        log.info(`Detected: ${detected.framework} (${detected.language})`)
        if (detected.presetSuggestion) {
          log.dim(`  Suggested preset: ${detected.presetSuggestion}`)
        }
      } else {
        log.dim('No framework detected — you can choose a preset manually')
      }
      log.blank()

      const answers = await askInitPrompts(detected)

      const preset = getPresetByName(answers.preset)
      if (!preset) {
        log.error(`Preset "${answers.preset}" not found`)
        process.exit(1)
      }

      const sectionParams = {
        maxLinesPerFile: answers.maxLinesPerFile,
        idealLineRange: answers.idealLineRange as [number, number],
        qualityLevel: answers.qualityLevel,
        responsiveMode: answers.responsiveMode,
        mobileFirstRoutes: answers.mobileFirstRoutes,
        desktopFirstRoutes: answers.desktopFirstRoutes,
        projectDescription: answers.projectDescription,
        techStack: [detected.framework ?? answers.preset],
      }

      const activeSections = preset.sections
        .filter((s: { sectionId: string }) => answers.enabledSections.includes(s.sectionId))
        .map((s: { sectionId: string; enabled: boolean }) => ({ ...s, enabled: true }))

      log.title('Generating files')

      const claudeMd = generateClaudeMd(activeSections, sectionParams)
      await writeTextFile(join(cwd, 'CLAUDE.md'), claudeMd)
      log.file('Created', 'CLAUDE.md')

      const settings = generateSettings(preset, answers.enabledHooks)
      await writeJsonFile(join(cwd, '.claude', 'settings.json'), settings)
      log.file('Created', '.claude/settings.json (hooks + permissions)')

      await generateHooks(cwd, answers.enabledHooks)

      // MCP tokens → .claude/settings.local.json
      if (answers.enabledMcps.length > 0) {
        await generateSettingsLocal(cwd, answers.enabledMcps, answers.collectedTokens)
      }

      // .env.example for documentation
      await generateEnvExample(cwd, answers.enabledMcps)

      // ANTHROPIC_API_KEY → ~/.zshrc
      if (answers.addApiKeyToZshrc && answers.collectedTokens['ANTHROPIC_API_KEY']) {
        await addToShellProfile('ANTHROPIC_API_KEY', answers.collectedTokens['ANTHROPIC_API_KEY'])
      }

      // Save all tokens for cross-project reuse
      if (Object.keys(answers.collectedTokens).length > 0) {
        await saveCredentials(answers.collectedTokens)
      }

      const manifest: ForgeProjectManifest = {
        version: '1.0.0',
        projectName: answers.projectName,
        preset: answers.preset,
        createdAt: new Date().toISOString(),
        lastSynced: new Date().toISOString(),
        config: {
          maxLinesPerFile: answers.maxLinesPerFile,
          idealLineRange: answers.idealLineRange as [number, number],
          qualityLevel: answers.qualityLevel,
          responsiveMode: answers.responsiveMode,
          mobileFirstRoutes: answers.mobileFirstRoutes,
          desktopFirstRoutes: answers.desktopFirstRoutes,
        },
        sections: answers.enabledSections,
        hooks: answers.enabledHooks,
        mcps: answers.enabledMcps,
        skills: [],
        customSections: [],
        managedFiles: [
          'CLAUDE.md',
          '.claude/settings.json',
          '.env.example',
          ...answers.enabledHooks.map((h: string) => `.claude/hooks/${h}.sh`),
        ],
      }

      await writeJsonFile(join(cwd, '.claude-forge.json'), manifest)
      log.file('Created', '.claude-forge.json')

      log.blank()
      log.success('Claude Code configuration ready!')
      log.blank()

      const nextSteps = ['Review CLAUDE.md and customize for your project']
      if (answers.addApiKeyToZshrc) {
        nextSteps.push('Run: source ~/.zshrc')
      }
      nextSteps.push('Run `claude-forge push` to sync to your config repo')
      nextSteps.push('Run `claude` to start coding!')

      log.dim('Next steps:')
      log.list(nextSteps)
    })
}
