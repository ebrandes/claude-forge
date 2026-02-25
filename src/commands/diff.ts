import { Command } from 'commander'
import { join } from 'node:path'
import chalk from 'chalk'
import { createTwoFilesPatch } from 'diff'
import { log } from '../utils/logger.js'
import { loadProjectManifest, ensureLoggedIn } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { fileExists, readTextFile } from '../utils/fs.js'

export function diffCommand(): Command {
  return new Command('diff')
    .description('Compare local configs with the sync repository')
    .action(async () => {
      const cwd = process.cwd()
      log.title('claude-forge diff')

      await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      const sync = new GitHubSync()
      await sync.pull()

      const projectPath = `projects/${manifest.projectName}`
      let hasDiffs = false

      for (const file of manifest.managedFiles) {
        const localPath = join(cwd, file)
        const remotePath = join(sync.getRepoDir(), projectPath, file)

        const localContent = await readTextFile(localPath) ?? ''
        const remoteContent = await readTextFile(remotePath) ?? ''

        if (localContent === remoteContent) continue

        hasDiffs = true
        const patch = createTwoFilesPatch(
          `remote/${file}`,
          `local/${file}`,
          remoteContent,
          localContent,
        )

        console.log()
        for (const line of patch.split('\n')) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            console.log(chalk.green(line))
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            console.log(chalk.red(line))
          } else if (line.startsWith('@@')) {
            console.log(chalk.cyan(line))
          } else {
            console.log(chalk.gray(line))
          }
        }
      }

      if (!hasDiffs) {
        log.success('All files are in sync!')
      }
    })
}
