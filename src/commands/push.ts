import { Command } from 'commander'
import { join } from 'node:path'
import { cp } from 'node:fs/promises'
import { log } from '../utils/logger.js'
import { loadProjectManifest, ensureLoggedIn } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { fileExists, ensureDir } from '../utils/fs.js'

export function pushCommand(): Command {
  return new Command('push')
    .description('Push project configs to the sync repository')
    .option('-m, --message <msg>', 'Custom commit message')
    .action(async (options) => {
      const cwd = process.cwd()
      log.title('claude-forge push')

      await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      const sync = new GitHubSync()
      await sync.pull()

      const projectPath = `projects/${manifest.projectName}`
      log.step(`Syncing to ${projectPath}/`)

      for (const file of manifest.managedFiles) {
        const sourcePath = join(cwd, file)
        if (!await fileExists(sourcePath)) {
          log.warn(`Skipping missing file: ${file}`)
          continue
        }

        const destPath = join(sync.getRepoDir(), projectPath, file)
        await ensureDir(join(destPath, '..'))
        await cp(sourcePath, destPath, { recursive: true })
        log.file('Synced', file)
      }

      const manifestDest = join(sync.getRepoDir(), projectPath, 'manifest.json')
      const updatedManifest = { ...manifest, lastSynced: new Date().toISOString() }
      const { writeJsonFile } = await import('../utils/fs.js')
      await writeJsonFile(manifestDest, updatedManifest)

      const commitMsg = options.message
        ?? `sync: ${manifest.projectName} (${new Date().toISOString().split('T')[0]})`

      await sync.commitAndPush(commitMsg)

      log.blank()
      log.success(`Pushed ${manifest.managedFiles.length} files for "${manifest.projectName}"`)
    })
}
