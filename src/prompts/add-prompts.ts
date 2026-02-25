import { input, confirm, editor, password } from '@inquirer/prompts'
import chalk from 'chalk'
import { log } from '../utils/logger.js'

export async function askForDescription(itemType: string): Promise<string> {
  return input({
    message: `Describe the ${itemType} you want to create:`,
    validate: (v) =>
      v.trim().length >= 10 || 'Please provide more detail (at least 10 characters)',
  })
}

export async function reviewGeneratedContent(
  label: string,
  content: string,
): Promise<{ accepted: boolean; content: string }> {
  log.blank()
  log.title(`Generated ${label}`)

  for (const line of content.split('\n')) {
    console.log(chalk.gray('  │ ') + line)
  }

  log.blank()

  const accept = await confirm({
    message: 'Accept this content?',
    default: true,
  })

  if (!accept) {
    const shouldEdit = await confirm({
      message: 'Would you like to edit it?',
      default: true,
    })

    if (shouldEdit) {
      const edited = await editor({
        message: `Edit the ${label}:`,
        default: content,
      })
      return { accepted: true, content: edited }
    }

    return { accepted: false, content }
  }

  return { accepted: true, content }
}

export async function askForAuthToken(
  envVarName: string,
  setupUrl?: string | null,
): Promise<string | null> {
  if (process.env[envVarName]) {
    log.success(`${envVarName} already set in environment`)
    return null
  }

  log.blank()
  log.warn(`${envVarName} is required for authentication.`)
  if (setupUrl) {
    log.dim(`  Get your token at: ${setupUrl}`)
  }

  const token = await password({ message: `Paste ${envVarName} (or Enter to skip):`, mask: '*' })
  return token || null
}
