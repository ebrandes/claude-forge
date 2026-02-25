import { Command } from 'commander'
import { join } from 'node:path'
import { cp } from 'node:fs/promises'
import { select } from '@inquirer/prompts'
import { log } from '../utils/logger.js'
import { detectStack } from '../utils/detect-stack.js'
import { getPresetByName } from '../presets/index.js'
import { generateClaudeMd } from '../generators/claude-md.js'
import { generateSettings } from '../generators/settings.js'
import { generateHooks } from '../generators/hooks.js'
import { addToShellProfile } from '../generators/env-file.js'
import { writeTextFile, writeJsonFile, fileExists, ensureDir, readJsonFile } from '../utils/fs.js'
import { saveCredentials } from '../core/credential-store.js'
import { loadGlobalConfig, loadProjectManifest, saveProjectManifest } from '../core/config.js'
import { runLogin } from './login.js'
import { GitHubSync } from '../core/github-sync.js'
import { askInitPrompts } from '../prompts/init-prompts.js'
import type { ForgeProjectManifest } from '../types/index.js'

export function initCommand(): Command {
  return new Command('init')
    .description('Initialize Claude Code configuration for the current project')
    .option('--preset <name>', 'Use a specific preset directly')
    .option('--new', 'Skip pulling existing configs and create fresh')
    .action(async (options) => {
      const cwd = process.cwd()
      log.title('claude-forge init')

      // Step 1: Ensure config repo exists
      let globalConfig = await loadGlobalConfig()
      if (!globalConfig) {
        log.warn('No config repo configured. Let\'s set that up first.\n')
        await runLogin()
        globalConfig = await loadGlobalConfig()
        log.blank()
      }

      if (!globalConfig) {
        log.error('Config repo setup failed.')
        process.exit(1)
      }

      // Step 2: Check if project already has local configs
      const localManifest = await loadProjectManifest(cwd)
      if (localManifest && !options.new) {
        const handled = await handleExistingProject(cwd, localManifest, globalConfig)
        if (handled) return
      }

      // Step 3: Check if repo has existing configs to pull
      if (!options.new) {
        const pulled = await tryPullFromRepo(cwd, globalConfig)
        if (pulled) return
      }

      // Step 4: Full setup wizard (first time or user chose to create new)
      await runFullSetup(cwd)
    })
}

async function handleExistingProject(
  cwd: string,
  manifest: ForgeProjectManifest,
  globalConfig: { repoOwner: string; repoName: string },
): Promise<boolean> {
  log.info(`This project is already configured (preset: ${manifest.preset})`)
  log.blank()

  const action = await select({
    message: 'What would you like to do?',
    choices: [
      { name: 'Push these configs to your config repo', value: 'push' },
      { name: 'Pull configs from your config repo', value: 'pull' },
      { name: 'Reconfigure from scratch', value: 'new' },
    ],
  })

  if (action === 'new') return false

  if (action === 'push') {
    return await pushToRepo(cwd, manifest, globalConfig)
  }

  return await pullFromRepo(cwd, manifest.managedFiles, globalConfig)
}

async function tryPullFromRepo(
  cwd: string,
  globalConfig: { repoOwner: string; repoName: string },
): Promise<boolean> {
  const sync = new GitHubSync()

  try {
    await sync.pull()
  } catch {
    return false
  }

  const repoDir = sync.getRepoDir()
  const manifestPath = join(repoDir, 'manifest.json')
  const remoteManifest = await readJsonFile<ForgeProjectManifest>(manifestPath)

  if (!remoteManifest) return false

  log.success(`Found existing configs in ${globalConfig.repoOwner}/${globalConfig.repoName}`)
  const managedFiles = remoteManifest.managedFiles ?? []
  log.dim(`  Files: ${managedFiles.slice(0, 4).join(', ')}${managedFiles.length > 4 ? ` (+${managedFiles.length - 4} more)` : ''}`)
  log.dim(`  Preset: ${remoteManifest.preset}`)
  log.blank()

  const action = await select({
    message: 'What would you like to do?',
    choices: [
      { name: 'Pull these configs into this project', value: 'pull' },
      { name: 'Create new configs from scratch', value: 'new' },
    ],
  })

  if (action === 'new') return false

  // Pull configs
  log.step('Pulling configs')
  let updated = 0

  for (const file of managedFiles) {
    const remotePath = join(repoDir, file)
    const localPath = join(cwd, file)

    if (!await fileExists(remotePath)) continue

    await ensureDir(join(localPath, '..'))
    await cp(remotePath, localPath, { recursive: true })
    log.file('Pulled', file)
    updated++
  }

  await saveProjectManifest(cwd, {
    ...remoteManifest,
    lastSynced: new Date().toISOString(),
  })

  log.blank()
  log.success(`Pulled ${updated} files — project is ready!`)
  log.dim('  Run `claude` to start coding!')
  return true
}

async function pushToRepo(
  cwd: string,
  manifest: ForgeProjectManifest,
  globalConfig: { repoOwner: string; repoName: string },
): Promise<boolean> {
  const sync = new GitHubSync()

  try {
    await sync.pull()
  } catch {
    // empty repo, continue
  }

  const repoDir = sync.getRepoDir()
  log.step('Pushing configs')

  for (const file of manifest.managedFiles) {
    const sourcePath = join(cwd, file)
    if (!await fileExists(sourcePath)) continue

    const destPath = join(repoDir, file)
    await ensureDir(join(destPath, '..'))
    await cp(sourcePath, destPath, { recursive: true })
    log.file('Synced', file)
  }

  const manifestDest = join(repoDir, 'manifest.json')
  await writeJsonFile(manifestDest, { ...manifest, lastSynced: new Date().toISOString() })

  await sync.commitAndPush(`sync: update configs (${new Date().toISOString().split('T')[0]})`)

  log.blank()
  log.success(`Pushed ${manifest.managedFiles.length} files to "${globalConfig.repoOwner}/${globalConfig.repoName}"`)
  log.dim('  Run "claude-forge pull" in any project to use these configs.')
  return true
}

async function pullFromRepo(
  cwd: string,
  localManagedFiles: string[],
  globalConfig: { repoOwner: string; repoName: string },
): Promise<boolean> {
  const sync = new GitHubSync()

  try {
    await sync.pull()
  } catch {
    return false
  }

  const repoDir = sync.getRepoDir()
  const manifestPath = join(repoDir, 'manifest.json')
  const remoteManifest = await readJsonFile<ForgeProjectManifest>(manifestPath)

  if (!remoteManifest) {
    log.warn('No configs found in your repo. Run "claude-forge push" first.')
    return false
  }

  const filesToPull = remoteManifest.managedFiles ?? localManagedFiles
  log.step('Pulling configs')
  let updated = 0

  for (const file of filesToPull) {
    const remotePath = join(repoDir, file)
    const localPath = join(cwd, file)

    if (!await fileExists(remotePath)) continue

    await ensureDir(join(localPath, '..'))
    await cp(remotePath, localPath, { recursive: true })
    log.file('Updated', file)
    updated++
  }

  await saveProjectManifest(cwd, {
    ...remoteManifest,
    lastSynced: new Date().toISOString(),
  })

  log.blank()
  log.success(`Pulled ${updated} files from "${globalConfig.repoOwner}/${globalConfig.repoName}"`)
  return true
}

async function runFullSetup(cwd: string): Promise<void> {
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

  if (answers.addApiKeyToZshrc && answers.collectedTokens['ANTHROPIC_API_KEY']) {
    await addToShellProfile('ANTHROPIC_API_KEY', answers.collectedTokens['ANTHROPIC_API_KEY'])
  }

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
}
