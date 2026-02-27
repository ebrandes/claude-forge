import type { SectionParams } from './section.js'

export type HookEvent =
  | 'PostToolUse'
  | 'PreToolUse'
  | 'Stop'
  | 'UserPromptSubmit'
  | 'SessionStart'
  | 'SubAgentToolUse'

export const VALID_HOOK_EVENTS: HookEvent[] = [
  'PostToolUse',
  'PreToolUse',
  'Stop',
  'UserPromptSubmit',
  'SessionStart',
  'SubAgentToolUse',
]

export interface PresetDefinition {
  name: string
  displayName: string
  description: string
  sections: SectionConfig[]
  hooks: HookConfig[]
  mcps: McpRecommendation[]
  settings: SettingsOverrides
  defaults: PresetDefaults
}

export interface SectionConfig {
  sectionId: string
  enabled: boolean
  overrides?: Partial<SectionParams>
  customContent?: string
}

export interface HookConfig {
  name: string
  event: HookEvent
  matcher: string
  templateId: string
  timeout: number
  required: boolean
}

export interface McpRecommendation {
  name: string
  reason: string
  requiresAuth: boolean
  authType: 'api-key' | 'oauth' | 'ssh' | 'token'
}

export interface SettingsOverrides {
  permissions?: {
    allow?: string[]
  }
}

export interface PresetDefaults {
  maxLinesPerFile: number
  idealLineRange: [number, number]
  qualityLevel: 'strict' | 'moderate' | 'relaxed'
}
