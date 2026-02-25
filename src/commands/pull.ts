import { Command } from 'commander'
import { join } from 'node:path'
import { cp } from 'node:fs/promises'
import { confirm } from '@inquirer/prompts'
import { log } from '../utils/logger.js'
import { loadProjectManifest, ensureLoggedIn, saveProjectManifest } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { fileExists, readTextFile, ensureDir } from '../utils/fs.js'

export function pullCommand(): Command {
  return new Command('pull')
    .description('Pull project configs from the sync repository')
    .option('--force', 'Overwrite without confirmation')
    .action(async (options) => {
      const cwd = process.cwd()
      log.title('claude-forge pull')

      await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      const sync = new GitHubSync()
      await sync.pull()

      const projectPath = `projects/${manifest.projectName}`
      const hasProject = await sync.fileExistsInRepo(projectPath)

      if (!hasProject) {
        log.error(`No synced data found for "${manifest.projectName}". Run "claude-forge push" first.`)
        process.exit(1)
      }

      log.step(`Pulling from ${projectPath}/`)
      let updated = 0

      for (const file of manifest.managedFiles) {
        const remotePath = join(sync.getRepoDir(), projectPath, file)
        const localPath = join(cwd, file)

        if (!await fileExists(remotePath)) {
          log.dim(`  Skip (not in remote): ${file}`)
          continue
        }

        const localExists = await fileExists(localPath)
        if (localExists && !options.force) {
          const localContent = await readTextFile(localPath)
          const remoteContent = await readTextFile(remotePath)

          if (localContent === remoteContent) {
            log.dim(`  Unchanged: ${file}`)
            continue
          }

          const overwrite = await confirm({
            message: `Overwrite ${file}?`,
            default: true,
          })
          if (!overwrite) {
            log.dim(`  Skipped: ${file}`)
            continue
          }
        }

        await ensureDir(join(localPath, '..'))
        await cp(remotePath, localPath, { recursive: true })
        log.file('Updated', file)
        updated++
      }

      await saveProjectManifest(cwd, {
        ...manifest,
        lastSynced: new Date().toISOString(),
      })

      log.blank()
      log.success(`Pulled ${updated} files for "${manifest.projectName}"`)
    })
}
