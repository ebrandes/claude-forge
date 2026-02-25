import { Command } from 'commander'
import chalk from 'chalk'
import { log } from '../utils/logger.js'
import { listPresets } from '../presets/index.js'
import { getAllHookTemplates } from '../hooks-library/index.js'
import { getAllMcpDefinitions } from '../mcps/index.js'
import { checkMcpCredential } from '../core/credential-store.js'

export function listCommand(): Command {
  return new Command('list')
    .description('List available presets, hooks, and MCP servers')
    .option('--presets', 'List presets only')
    .option('--hooks', 'List hooks only')
    .option('--mcps', 'List MCP servers only')
    .action(async (options) => {
      const showAll = !options.presets && !options.hooks && !options.mcps

      if (showAll || options.presets) {
        log.title('Available Presets')
        for (const preset of listPresets()) {
          console.log(
            chalk.bold.white(`  ${preset.name}`),
            chalk.gray('—'),
            chalk.dim(preset.displayName),
          )
          console.log(chalk.gray(`    ${preset.description}`))
          console.log(
            chalk.gray(`    Defaults: max ${preset.defaults.maxLinesPerFile} lines, ${preset.defaults.qualityLevel}`),
          )
          console.log()
        }
      }

      if (showAll || options.hooks) {
        log.title('Available Hooks')
        for (const hook of getAllHookTemplates()) {
          console.log(
            chalk.bold.white(`  ${hook.id}`),
            chalk.gray('—'),
            chalk.dim(hook.name),
          )
          console.log(chalk.gray(`    ${hook.description}`))
          console.log(chalk.gray(`    Event: ${hook.event}, Matcher: ${hook.matcher}`))
          console.log()
        }
      }

      if (showAll || options.mcps) {
        log.title('Available MCP Servers')
        for (const mcp of getAllMcpDefinitions()) {
          const hasAuth = checkMcpCredential(mcp)
          const status = mcp.requiresAuth
            ? (hasAuth ? chalk.green('authenticated') : chalk.yellow('needs setup'))
            : chalk.gray('no auth needed')

          console.log(
            chalk.bold.white(`  ${mcp.name}`),
            chalk.gray('—'),
            chalk.dim(mcp.displayName),
            `[${status}]`,
          )
          console.log(chalk.gray(`    ${mcp.description}`))
          if (mcp.authEnvVar) {
            console.log(chalk.gray(`    Env: ${mcp.authEnvVar}`))
          }
          console.log()
        }
      }
    })
}
