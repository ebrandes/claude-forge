import path from 'node:path'

import { buildRuleSystemPrompt, buildRuleUserPrompt } from '../ai/prompt-templates.js'
import { generateWithClaude } from '../core/anthropic-client.js'
import { writeTextFile, readJsonFile, writeJsonFile, ensureDir } from '../utils/fs.js'
import { log } from '../utils/logger.js'

import type { ForgeProjectManifest, RuleDefinition } from '../types/index.js'

export async function generateRuleFromDescription(description: string): Promise<RuleDefinition> {
  const result = await generateWithClaude(buildRuleSystemPrompt(), buildRuleUserPrompt(description))

  log.dim(`  (${result.inputTokens} in / ${result.outputTokens} out tokens)`)
  return parseRuleResponse(result.content)
}

function parseRuleResponse(raw: string): RuleDefinition {
  const cleaned = raw
    .replaceAll(/^```(?:json)?\n?/gm, '')
    .replaceAll(/\n?```$/gm, '')
    .trim()

  const parsed: unknown = JSON.parse(cleaned)
  validateRuleDefinition(parsed)
  return parsed
}

function validateRuleDefinition(obj: unknown): asserts obj is RuleDefinition {
  const rule = obj as Record<string, unknown>
  const required = ['name', 'displayName', 'description', 'content']
  for (const field of required) {
    if (!rule[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
}

export async function saveGeneratedRule(projectDir: string, rule: RuleDefinition): Promise<void> {
  const rulesDir = path.join(projectDir, '.claude', 'rules')
  await ensureDir(rulesDir)

  const rulePath = path.join(rulesDir, `${rule.name}.md`)
  await writeTextFile(rulePath, rule.content)
  log.file('Created', `.claude/rules/${rule.name}.md`)

  await updateManifestRules(projectDir, rule.name)
}

async function updateManifestRules(projectDir: string, ruleName: string): Promise<void> {
  const manifestPath = path.join(projectDir, '.claude-forge.json')
  const manifest = await readJsonFile<ForgeProjectManifest>(manifestPath)
  if (!manifest) {
    return
  }

  if (!manifest.rules.includes(ruleName)) {
    manifest.rules.push(ruleName)
  }
  const ruleFile = `.claude/rules/${ruleName}.md`
  if (!manifest.managedFiles.includes(ruleFile)) {
    manifest.managedFiles.push(ruleFile)
  }

  await writeJsonFile(manifestPath, manifest)
  log.file('Updated', '.claude-forge.json')
}
