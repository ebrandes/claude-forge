import { Command } from 'commander'
import { input } from '@inquirer/prompts'
import { log } from '../utils/logger.js'
import { isGhInstalled, isGhAuthenticated, ghRepoExists, exec, execInteractive } from '../utils/git.js'
import { saveGlobalConfig, loadGlobalConfig } from '../core/config.js'
import { ensureDir, getForgeRepoDir } from '../utils/fs.js'
import { gitClone } from '../utils/git.js'
import { existsSync } from 'node:fs'

export function loginCommand(): Command {
  return new Command('login')
    .description('Setup GitHub authentication and sync repository')
    .action(async () => {
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
      let repoSlug: string

      if (existing) {
        log.info(`Current sync repo: ${existing.repoOwner}/${existing.repoName}`)
        repoSlug = await input({
          message: 'Sync repo (owner/name):',
          default: `${existing.repoOwner}/${existing.repoName}`,
        })
      } else {
        repoSlug = await input({
          message: 'Sync repo (owner/name):',
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
        } catch (err) {
          log.error(`Failed to create repo. Create it manually on GitHub.`)
          process.exit(1)
        }
      } else {
        log.success(`Repo found: ${owner}/${name}`)
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
    })
}

async function getGhUsername(): Promise<string> {
  try {
    const result = await exec('gh', ['api', 'user', '--jq', '.login'])
    return result.stdout
  } catch {
    return 'user'
  }
}
