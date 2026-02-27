import { Command } from 'commander'

import { addAgentCommand } from './add-agent.js'
import { addHookCommand } from './add-hook.js'
import { addMcpCommand } from './add-mcp.js'
import { addRuleCommand } from './add-rule.js'
import { addSkillCommand } from './add-skill.js'

export function addCommand(): Command {
  const cmd = new Command('add').description(
    'Add AI-generated hooks, MCP servers, skills, rules, or agents',
  )

  cmd.addCommand(addHookCommand())
  cmd.addCommand(addMcpCommand())
  cmd.addCommand(addSkillCommand())
  cmd.addCommand(addRuleCommand())
  cmd.addCommand(addAgentCommand())

  return cmd
}
