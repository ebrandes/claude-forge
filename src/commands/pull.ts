import path from 'node:path'

import { confirm } from '@inquirer/prompts'
import { Command } from 'commander'

import { loadProjectManifest, ensureLoggedIn, saveProjectManifest } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { smartPullFile } from '../core/smart-pull.js'
import { hasForgeMarkers } from '../core/template-engine.js'
import { fileExists, readTextFile, readJsonFile } from '../utils/fs.js'
import { log } from '../utils/logger.js'

import type { ForgeProjectManifest } from '../types/index.js'

export function pullCommand(): Command {
  return new Command('pull')
    .description('Pull configs from your central config repository')
    .option('--force', 'Overwrite without confirmation')
    .action(async (options: { force?: boolean }) => {
      const cwd = process.cwd()
      log.title('claude-forge pull')

      const globalConfig = await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      const sync = new GitHubSync()
      await sync.pull()

      const repoDir = sync.getRepoDir()
      const hasConfigs = await sync.fileExistsInRepo('manifest.json')

      if (!hasConfigs) {
        log.error('No synced configs found. Run "claude-forge push" first.')
        process.exit(1)
      }

      // Use remote manifest's file list — it has the complete set
      const remoteManifest = await readJsonFile<ForgeProjectManifest>(
        path.join(repoDir, 'manifest.json'),
      )
      const filesToPull = remoteManifest?.managedFiles ?? manifest.managedFiles

      log.info(`Config repo: ${globalConfig.repoOwner}/${globalConfig.repoName}`)
      log.step('Pulling configs')
      let updated = 0

      for (const file of filesToPull) {
        const remotePath = path.join(repoDir, file)
        const localPath = path.join(cwd, file)

        if (!(await fileExists(remotePath))) {
          log.dim(`  Skip (not in repo): ${file}`)
          continue
        }

        // Check if files differ before prompting
        const localExists = await fileExists(localPath)
        if (localExists && !options.force) {
          const localContent = await readTextFile(localPath)
          const remoteContent = await readTextFile(remotePath)

          if (localContent === remoteContent) {
            log.dim(`  Unchanged: ${file}`)
            continue
          }

          const isMergeable = remoteContent !== null && hasForgeMarkers(remoteContent)
          const message = isMergeable
            ? `Merge ${file}? (remote sections updated, your customizations preserved)`
            : `Overwrite ${file}?`

          const proceed = await confirm({ message, default: true })
          if (!proceed) {
            log.dim(`  Skipped: ${file}`)
            continue
          }
        }

        const result = await smartPullFile(remotePath, localPath)

        if (result === 'unchanged') {
          log.dim(`  Unchanged: ${file}`)
        } else if (result === 'skipped') {
          log.dim(`  Skip (not in repo): ${file}`)
        } else {
          log.file(result === 'merged' ? 'Merged' : 'Updated', file)
          updated++
        }
      }

      // Merge remote managedFiles into local manifest
      const mergedFiles = [...new Set([...manifest.managedFiles, ...filesToPull])]

      await saveProjectManifest(cwd, {
        ...manifest,
        managedFiles: mergedFiles,
        lastSynced: new Date().toISOString(),
      })

      log.blank()
      log.success(
        `Pulled ${updated} files from "${globalConfig.repoOwner}/${globalConfig.repoName}"`,
      )
    })
}
