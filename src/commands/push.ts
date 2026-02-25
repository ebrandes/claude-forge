import { Command } from 'commander'
import { join } from 'node:path'
import { cp } from 'node:fs/promises'
import { log } from '../utils/logger.js'
import { loadProjectManifest, ensureLoggedIn, loadGlobalConfig } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { fileExists, ensureDir, writeJsonFile } from '../utils/fs.js'

export function pushCommand(): Command {
  return new Command('push')
    .description('Push configs to your central config repository')
    .option('-m, --message <msg>', 'Custom commit message')
    .action(async (options) => {
      const cwd = process.cwd()
      log.title('claude-forge push')

      const globalConfig = await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      const sync = new GitHubSync()
      await sync.pull()

      const presetPath = manifest.preset
      log.info(`Config repo: ${globalConfig.repoOwner}/${globalConfig.repoName}`)
      log.step(`Syncing preset "${presetPath}"`)

      for (const file of manifest.managedFiles) {
        const sourcePath = join(cwd, file)
        if (!await fileExists(sourcePath)) {
          log.warn(`Skipping missing file: ${file}`)
          continue
        }

        const destPath = join(sync.getRepoDir(), presetPath, file)
        await ensureDir(join(destPath, '..'))
        await cp(sourcePath, destPath, { recursive: true })
        log.file('Synced', file)
      }

      const manifestDest = join(sync.getRepoDir(), presetPath, 'manifest.json')
      const updatedManifest = { ...manifest, lastSynced: new Date().toISOString() }
      await writeJsonFile(manifestDest, updatedManifest)

      const commitMsg = options.message
        ?? `sync: ${presetPath} preset (${new Date().toISOString().split('T')[0]})`

      await sync.commitAndPush(commitMsg)

      log.blank()
      log.success(`Pushed ${manifest.managedFiles.length} files to "${globalConfig.repoOwner}/${globalConfig.repoName}/${presetPath}"`)
      log.dim('  Any project using this preset can now pull these configs.')
    })
}
