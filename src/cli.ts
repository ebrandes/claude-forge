import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { pushCommand } from './commands/push.js'
import { pullCommand } from './commands/pull.js'
import { listCommand } from './commands/list.js'
import { loginCommand } from './commands/login.js'
import { diffCommand } from './commands/diff.js'
import { presetCommand } from './commands/preset.js'
import { doctorCommand } from './commands/doctor.js'
import { addCommand } from './commands/add.js'

export function run(argv: string[]) {
  const program = new Command()

  program
    .name('claude-forge')
    .description('Manage Claude Code configurations across projects')
    .version('1.0.0')

  program.addCommand(initCommand())
  program.addCommand(pushCommand())
  program.addCommand(pullCommand())
  program.addCommand(listCommand())
  program.addCommand(loginCommand())
  program.addCommand(diffCommand())
  program.addCommand(presetCommand())
  program.addCommand(doctorCommand())
  program.addCommand(addCommand())

  program.parse(argv)
}
