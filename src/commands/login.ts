import { Command } from 'commander'
import { input, confirm, select } from '@inquirer/prompts'
import { log } from '../utils/logger.js'
import {
  isGhInstalled,
  isGhAuthenticated,
  ghRepoExists,
  ghFindReposByTopic,
  ghAddTopics,
  exec,
  execInteractive,
} from '../utils/git.js'
import { saveGlobalConfig, loadGlobalConfig } from '../core/config.js'
import { ensureDir, getForgeRepoDir } from '../utils/fs.js'
import { gitClone } from '../utils/git.js'
import { existsSync } from 'node:fs'

const FORGE_TOPIC = 'claude-forge'

export function loginCommand(): Command {
  return new Command('login')
    .description('Setup GitHub authentication and sync repository')
    .action(async () => {
      await runLogin()
    })
}

export async function runLogin(): Promise<void> {
  log.title('claude-forge login')

  if (!await isGhInstalled()) {
    log.error('GitHub CLI (gh) is required but not installed.')
    log.dim('Install it with: brew install gh')
    process.exit(1)
  }
  log.success('GitHub CLI found')

  if (!await isGhAuthenticated()) {
    log.warn('Not authenticated with GitHub. Running gh auth login...')
    try {
      await execInteractive('gh', ['auth', 'login'])
    } catch {
      log.error('GitHub authentication failed. Run "gh auth login" manually.')
      process.exit(1)
    }
  }
  log.success('Authenticated with GitHub')

  const existing = await loadGlobalConfig()

  if (existing) {
    log.info(`Already connected to: ${existing.repoOwner}/${existing.repoName}`)
    const keepCurrent = await confirm({
      message: `Keep using ${existing.repoOwner}/${existing.repoName}?`,
      default: true,
    })
    if (keepCurrent) {
      log.success('Login confirmed!')
      return
    }
  }

  // Try to find an existing config repo by topic
  let repoSlug: string | null = null

  log.step('Searching for existing config repos...')
  const found = await ghFindReposByTopic(FORGE_TOPIC)

  if (found.length === 1) {
    const use = await confirm({
      message: `Found config repo: ${found[0].nameWithOwner}. Use this?`,
      default: true,
    })
    if (use) repoSlug = found[0].nameWithOwner
  } else if (found.length > 1) {
    repoSlug = await select({
      message: 'Multiple config repos found. Which one?',
      choices: [
        ...found.map(r => ({ name: r.nameWithOwner, value: r.nameWithOwner })),
        { name: 'Create a new one', value: '__new__' },
      ],
    })
    if (repoSlug === '__new__') repoSlug = null
  } else {
    log.dim('  No existing config repo found')
  }

  if (!repoSlug) {
    repoSlug = await input({
      message: 'Repo name for your configs:',
      default: 'my-claude-configs',
      validate: (v) => v.length > 0 || 'Required',
    })
  }

  const parts = repoSlug.includes('/')
    ? repoSlug.split('/')
    : [await getGhUsername(), repoSlug]

  const [owner, name] = parts

  const repoExists = await ghRepoExists(owner, name)
  if (!repoExists) {
    log.step(`Creating private repo: ${owner}/${name}`)
    try {
      await exec('gh', ['repo', 'create', `${owner}/${name}`, '--private'])
      log.success(`Created private repo: ${owner}/${name}`)
    } catch {
      log.error('Failed to create repo. Create it manually on GitHub.')
      process.exit(1)
    }
  } else {
    log.success(`Repo found: ${owner}/${name}`)
  }

  // Tag the repo so we can find it later
  try {
    await ghAddTopics(owner, name, [FORGE_TOPIC])
  } catch {
    log.dim('  Could not add topic (non-critical)')
  }

  const repoDir = getForgeRepoDir()
  if (!existsSync(repoDir)) {
    log.step('Cloning sync repo locally...')
    await ensureDir(repoDir)
    try {
      await gitClone(`https://github.com/${owner}/${name}.git`, repoDir)
      log.success('Repo cloned')
    } catch {
      log.warn('Clone failed (repo might be empty). Initializing locally...')
      await exec('git', ['init'], repoDir)
      await exec('git', ['remote', 'add', 'origin', `https://github.com/${owner}/${name}.git`], repoDir)
    }
  } else {
    log.success('Sync repo already cloned')
  }

  await saveGlobalConfig({
    repoUrl: `https://github.com/${owner}/${name}.git`,
    repoOwner: owner,
    repoName: name,
    localRepoPath: repoDir,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  })

  log.blank()
  log.success('Login complete! You can now use claude-forge init, push, and pull.')
}

async function getGhUsername(): Promise<string> {
  try {
    const result = await exec('gh', ['api', 'user', '--jq', '.login'])
    return result.stdout
  } catch {
    return 'user'
  }
}
