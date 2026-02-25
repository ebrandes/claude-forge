import { Command } from 'commander'
import { join } from 'node:path'
import chalk from 'chalk'
import { createTwoFilesPatch } from 'diff'
import { log } from '../utils/logger.js'
import { loadProjectManifest, ensureLoggedIn } from '../core/config.js'
import { GitHubSync } from '../core/github-sync.js'
import { readTextFile } from '../utils/fs.js'

export function diffCommand(): Command {
  return new Command('diff')
    .description('Compare local configs with the central config repository')
    .action(async () => {
      const cwd = process.cwd()
      log.title('claude-forge diff')

      const globalConfig = await ensureLoggedIn()

      const manifest = await loadProjectManifest(cwd)
      if (!manifest) {
        log.error('No .claude-forge.json found. Run "claude-forge init" first.')
        process.exit(1)
      }

      const sync = new GitHubSync()
      await sync.pull()

      const repoDir = sync.getRepoDir()
      log.info(`Comparing with: ${globalConfig.repoOwner}/${globalConfig.repoName}`)
      let hasDiffs = false

      for (const file of manifest.managedFiles) {
        const localPath = join(cwd, file)
        const remotePath = join(repoDir, file)

        const localContent = await readTextFile(localPath) ?? ''
        const remoteContent = await readTextFile(remotePath) ?? ''

        if (localContent === remoteContent) continue

        hasDiffs = true
        const patch = createTwoFilesPatch(
          `repo/${file}`,
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
