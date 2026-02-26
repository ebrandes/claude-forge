import path from 'node:path'

import { buildSkillSystemPrompt, buildSkillUserPrompt } from '../ai/prompt-templates.js'
import { generateWithClaude } from '../core/anthropic-client.js'
import { writeTextFile, readJsonFile, writeJsonFile, ensureDir } from '../utils/fs.js'
import { log } from '../utils/logger.js'

import type { ForgeProjectManifest, SkillDefinition } from '../types/index.js'

export async function generateSkillFromDescription(description: string): Promise<SkillDefinition> {
  const result = await generateWithClaude(
    buildSkillSystemPrompt(),
    buildSkillUserPrompt(description),
  )

  log.dim(`  (${result.inputTokens} in / ${result.outputTokens} out tokens)`)
  return parseSkillResponse(result.content)
}

function parseSkillResponse(raw: string): SkillDefinition {
  const cleaned = raw
    .replaceAll(/^```(?:json)?\n?/gm, '')
    .replaceAll(/\n?```$/gm, '')
    .trim()

  const parsed: unknown = JSON.parse(cleaned)
  validateSkillDefinition(parsed)
  return parsed
}

function validateSkillDefinition(obj: unknown): asserts obj is SkillDefinition {
  const skill = obj as Record<string, unknown>
  const required = ['name', 'displayName', 'description', 'content']
  for (const field of required) {
    if (!skill[field]) throw new Error(`Missing required field: ${field}`)
  }
}

export async function saveGeneratedSkill(
  projectDir: string,
  skill: SkillDefinition,
): Promise<void> {
  const commandsDir = path.join(projectDir, '.claude', 'commands')
  await ensureDir(commandsDir)

  const skillPath = path.join(commandsDir, `${skill.name}.md`)
  await writeTextFile(skillPath, skill.content)
  log.file('Created', `.claude/commands/${skill.name}.md`)

  await updateManifestSkills(projectDir, skill.name)
}

async function updateManifestSkills(projectDir: string, skillName: string): Promise<void> {
  const manifestPath = path.join(projectDir, '.claude-forge.json')
  const manifest = await readJsonFile<ForgeProjectManifest>(manifestPath)
  if (!manifest) return

  if (!manifest.skills.includes(skillName)) {
    manifest.skills.push(skillName)
  }
  const skillFile = `.claude/commands/${skillName}.md`
  if (!manifest.managedFiles.includes(skillFile)) {
    manifest.managedFiles.push(skillFile)
  }

  await writeJsonFile(manifestPath, manifest)
  log.file('Updated', '.claude-forge.json')
}
