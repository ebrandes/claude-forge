import Anthropic from '@anthropic-ai/sdk'
import { password } from '@inquirer/prompts'

import { log } from '../utils/logger.js'

import { getSavedToken, saveCredentials } from './credential-store.js'

let clientInstance: Anthropic | null = null

export async function resolveApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY
  }

  const saved = await getSavedToken('ANTHROPIC_API_KEY')
  if (saved) {
    return saved
  }

  log.warn('ANTHROPIC_API_KEY is not set.')
  log.dim('  Get one at: https://console.anthropic.com/settings/keys')

  const token = await password({ message: 'Paste your Anthropic API key:', mask: '*' })
  if (!token) {
    log.error('API key is required for AI-assisted features.')
    process.exit(1)
  }

  await saveCredentials({ ANTHROPIC_API_KEY: token })
  log.success('API key saved for future use')

  return token
}

export async function getAnthropicClient(): Promise<Anthropic> {
  if (clientInstance) return clientInstance

  const apiKey = await resolveApiKey()
  clientInstance = new Anthropic({ apiKey })
  return clientInstance
}

export interface GenerateResult {
  content: string
  model: string
  inputTokens: number
  outputTokens: number
}

export async function generateWithClaude(
  systemPrompt: string,
  userMessage: string,
): Promise<GenerateResult> {
  const client = await getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock) {
    throw new Error('No text content in API response')
  }

  return {
    content: textBlock.text,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
