import { Command } from 'commander'

import { addHookCommand } from './add-hook.js'
import { addMcpCommand } from './add-mcp.js'
import { addSkillCommand } from './add-skill.js'

export function addCommand(): Command {
  const cmd = new Command('add').description('Add AI-generated hooks, MCP servers, or skills')

  cmd.addCommand(addHookCommand())
  cmd.addCommand(addMcpCommand())
  cmd.addCommand(addSkillCommand())

  return cmd
}
