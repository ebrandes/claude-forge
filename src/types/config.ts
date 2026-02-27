export interface ForgeGlobalConfig {
  repoUrl: string
  repoOwner: string
  repoName: string
  localRepoPath: string
  createdAt: string
}

export interface ForgeProjectManifest {
  version: string
  projectName: string
  preset: string
  createdAt: string
  lastSynced: string
  config: ProjectConfig
  sections: string[]
  hooks: string[]
  mcps: string[]
  skills: string[]
  rules: string[]
  agents: string[]
  customSections: CustomSection[]
  managedFiles: string[]
}

export interface ProjectConfig {
  maxLinesPerFile: number
  idealLineRange: [number, number]
  qualityLevel: 'strict' | 'moderate' | 'relaxed'
  responsiveMode?: 'mobile-first' | 'desktop-first' | 'context-aware'
  mobileFirstRoutes?: string[]
  desktopFirstRoutes?: string[]
}

export interface CustomSection {
  id: string
  title: string
  emoji: string
  order: number
  content: string
}

export interface CredentialCache {
  tokens: Record<string, string>
  updatedAt: string
}
