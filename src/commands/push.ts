import { cp } from 'node:fs/promises'
import path from 'node:path'

import { Command } from 'commander'

import { loadProjectManifest, ensureLoggedIn, saveProjectManifest } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { fileExists, ensureDir, writeJsonFile, listFilesRecursive } from '../utils/fs.js'
import { log } from '../utils/logger.js'

export function pushCommand(): Command {
  return new Command('push')
    .description('Push configs to your central config repository')
    .option('-m, --message <msg>', 'Custom commit message')
    .action(async (options: { message?: string }) => {
      const cwd = process.cwd()
      log.title('claude-forge push')

      const globalConfig = await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      // Auto-discover all files inside .claude/ not yet in managedFiles
      const discovered = await discoverUnmanagedFiles(cwd, manifest.managedFiles)
      if (discovered.length > 0) {
        manifest.managedFiles.push(...discovered)
        manifest.hooks = syncHookIds(manifest.managedFiles)
        await saveProjectManifest(cwd, manifest)
        for (const file of discovered) {
          log.file('Discovered', file)
        }
      }

      const sync = new GitHubSync()
      await sync.pull()

      const repoDir = sync.getRepoDir()
      log.info(`Config repo: ${globalConfig.repoOwner}/${globalConfig.repoName}`)
      log.step('Syncing configs')

      for (const file of manifest.managedFiles) {
        const sourcePath = path.join(cwd, file)
        if (!(await fileExists(sourcePath))) {
          log.warn(`Skipping missing file: ${file}`)
          continue
        }

        const destPath = path.join(repoDir, file)
        await ensureDir(path.join(destPath, '..'))
        await cp(sourcePath, destPath, { recursive: true })
        log.file('Synced', file)
      }

      const manifestDest = path.join(repoDir, 'manifest.json')
      const updatedManifest = { ...manifest, lastSynced: new Date().toISOString() }
      await writeJsonFile(manifestDest, updatedManifest)

      const commitMsg =
        options.message ?? `sync: update configs (${new Date().toISOString().split('T')[0]})`

      await sync.commitAndPush(commitMsg)

      log.blank()
      log.success(
        `Pushed ${manifest.managedFiles.length} files to "${globalConfig.repoOwner}/${globalConfig.repoName}"`,
      )
      log.dim('  Run "claude-forge pull" in any project to use these configs.')
    })
}

async function discoverUnmanagedFiles(
  projectDir: string,
  managedFiles: string[],
): Promise<string[]> {
  const claudeDir = path.join(projectDir, '.claude')
  const allFiles = await listFilesRecursive(claudeDir)

  const newFiles: string[] = []
  for (const absolutePath of allFiles) {
    const relativePath = `.claude/${path.relative(claudeDir, absolutePath)}`

    // Skip settings.local.json — it's project-specific
    if (relativePath === '.claude/settings.local.json') continue

    if (!managedFiles.includes(relativePath)) {
      newFiles.push(relativePath)
    }
  }

  return newFiles
}

function syncHookIds(managedFiles: string[]): string[] {
  return managedFiles
    .filter((f) => f.startsWith('.claude/hooks/') && f.endsWith('.sh'))
    .map((f) => f.replace('.claude/hooks/', '').replace('.sh', ''))
}
