import { Command } from 'commander'
import chalk from 'chalk'
import { log } from '../utils/logger.js'
import { isGhInstalled, isGhAuthenticated } from '../utils/git.js'
import { loadGlobalConfig, loadProjectManifest } from '../core/config.js'
import { loadCredentials } from '../core/credential-store.js'
import { getMcpDefinition } from '../mcps/index.js'
import { fileExists } from '../utils/fs.js'
import { join } from 'node:path'

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Validate environment, credentials, and project configuration')
    .action(async () => {
      const cwd = process.cwd()
      let issues = 0

      log.title('Environment')
      issues += await checkItem('gh CLI installed', () => isGhInstalled())
      issues += await checkItem('GitHub authenticated', () => isGhAuthenticated())

      const config = await loadGlobalConfig()
      if (config) {
        printOk(`Sync repo: ${config.repoOwner}/${config.repoName}`)
      } else {
        printFail('Sync repo not configured')
        console.log(chalk.dim('    → Run: claude-forge login'))
        issues++
      }

      log.title('API Keys')
      issues += checkEnvVar('ANTHROPIC_API_KEY', 'https://console.anthropic.com/settings/keys')

      const manifest = await loadProjectManifest(cwd)
      if (manifest) {
        for (const mcpName of manifest.mcps) {
          const def = getMcpDefinition(mcpName)
          if (!def?.requiresAuth || !def.authEnvVar) continue

          const hasEnv = process.env[def.authEnvVar] !== undefined
          const saved = await loadCredentials()
          const hasSaved = saved?.tokens?.[def.authEnvVar] !== undefined

          if (hasEnv || hasSaved) {
            printOk(`${def.authEnvVar} is set${hasSaved && !hasEnv ? ' (saved in forge)' : ''}`)
          } else {
            printFail(`${def.authEnvVar} is NOT set`)
            if (def.setupUrl) {
              console.log(chalk.dim(`    → Get one at: ${def.setupUrl}`))
            }
            issues++
          }
        }
      }

      log.title('Project')
      if (manifest) {
        printOk(`.claude-forge.json found (preset: ${manifest.preset})`)
      } else {
        printFail('.claude-forge.json not found')
        console.log(chalk.dim('    → Run: claude-forge init'))
        issues++
      }

      issues += await checkFile(cwd, 'CLAUDE.md')
      issues += await checkFile(cwd, '.claude/settings.json')
      issues += await checkFile(cwd, '.env.example')

      if (manifest?.mcps.length) {
        issues += await checkFile(cwd, '.claude/settings.local.json')
      }

      log.blank()
      if (issues === 0) {
        log.success('Everything looks good!')
      } else {
        log.warn(`${issues} issue${issues > 1 ? 's' : ''} found. See above for details.`)
      }
    })
}

function printOk(msg: string) {
  console.log(chalk.green('  ✓'), msg)
}

function printFail(msg: string) {
  console.log(chalk.red('  ✗'), msg)
}

async function checkItem(label: string, check: () => Promise<boolean>): Promise<number> {
  const ok = await check()
  ok ? printOk(label) : printFail(label)
  return ok ? 0 : 1
}

function checkEnvVar(envVar: string, setupUrl?: string): number {
  if (process.env[envVar]) {
    printOk(`${envVar} is set`)
    return 0
  }
  printFail(`${envVar} is NOT set`)
  if (setupUrl) {
    console.log(chalk.dim(`    → Get one at: ${setupUrl}`))
  }
  return 1
}

async function checkFile(cwd: string, relativePath: string): Promise<number> {
  const exists = await fileExists(join(cwd, relativePath))
  exists ? printOk(`${relativePath} exists`) : printFail(`${relativePath} not found`)
  return exists ? 0 : 1
}
