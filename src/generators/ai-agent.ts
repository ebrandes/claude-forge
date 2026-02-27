import path from 'node:path'

import { buildAgentSystemPrompt, buildAgentUserPrompt } from '../ai/prompt-templates.js'
import { generateWithClaude } from '../core/anthropic-client.js'
import { writeTextFile, readJsonFile, writeJsonFile, ensureDir } from '../utils/fs.js'
import { log } from '../utils/logger.js'

import type { AgentDefinition, ForgeProjectManifest } from '../types/index.js'

export async function generateAgentFromDescription(description: string): Promise<AgentDefinition> {
  const result = await generateWithClaude(
    buildAgentSystemPrompt(),
    buildAgentUserPrompt(description),
  )

  log.dim(`  (${result.inputTokens} in / ${result.outputTokens} out tokens)`)
  return parseAgentResponse(result.content)
}

function parseAgentResponse(raw: string): AgentDefinition {
  const cleaned = raw
    .replaceAll(/^```(?:json)?\n?/gm, '')
    .replaceAll(/\n?```$/gm, '')
    .trim()

  const parsed: unknown = JSON.parse(cleaned)
  validateAgentDefinition(parsed)
  return parsed
}

function validateAgentDefinition(obj: unknown): asserts obj is AgentDefinition {
  const agent = obj as Record<string, unknown>
  const required = ['name', 'displayName', 'description', 'content']
  for (const field of required) {
    if (!agent[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
}

export async function saveGeneratedAgent(
  projectDir: string,
  agent: AgentDefinition,
): Promise<void> {
  const agentsDir = path.join(projectDir, '.claude', 'agents')
  await ensureDir(agentsDir)

  const agentPath = path.join(agentsDir, `${agent.name}.md`)
  await writeTextFile(agentPath, agent.content)
  log.file('Created', `.claude/agents/${agent.name}.md`)

  await updateManifestAgents(projectDir, agent.name)
}

async function updateManifestAgents(projectDir: string, agentName: string): Promise<void> {
  const manifestPath = path.join(projectDir, '.claude-forge.json')
  const manifest = await readJsonFile<ForgeProjectManifest>(manifestPath)
  if (!manifest) {
    return
  }

  if (!manifest.agents.includes(agentName)) {
    manifest.agents.push(agentName)
  }
  const agentFile = `.claude/agents/${agentName}.md`
  if (!manifest.managedFiles.includes(agentFile)) {
    manifest.managedFiles.push(agentFile)
  }

  await writeJsonFile(manifestPath, manifest)
  log.file('Updated', '.claude-forge.json')
}
