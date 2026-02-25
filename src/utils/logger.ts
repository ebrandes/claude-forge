import chalk from 'chalk'

export const log = {
  info(message: string) {
    console.log(chalk.blue('ℹ'), message)
  },

  success(message: string) {
    console.log(chalk.green('✓'), message)
  },

  warn(message: string) {
    console.log(chalk.yellow('⚠'), message)
  },

  error(message: string) {
    console.error(chalk.red('✗'), message)
  },

  step(message: string) {
    console.log(chalk.cyan('→'), message)
  },

  title(message: string) {
    console.log()
    console.log(chalk.bold.white(message))
    console.log(chalk.gray('─'.repeat(50)))
  },

  dim(message: string) {
    console.log(chalk.gray(message))
  },

  file(action: string, filePath: string) {
    console.log(chalk.green('✓'), chalk.gray(action), chalk.white(filePath))
  },

  list(items: string[]) {
    for (const item of items) {
      console.log(chalk.gray('  •'), item)
    }
  },

  blank() {
    console.log()
  },
}
