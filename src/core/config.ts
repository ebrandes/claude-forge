import path from 'node:path'

import { readJsonFile, writeJsonFile, getForgeConfigPath } from '../utils/fs.js'

import type { ForgeGlobalConfig, ForgeProjectManifest } from '../types/index.js'

export async function loadGlobalConfig(): Promise<ForgeGlobalConfig | null> {
  return readJsonFile<ForgeGlobalConfig>(getForgeConfigPath())
}

export async function saveGlobalConfig(config: ForgeGlobalConfig): Promise<void> {
  await writeJsonFile(getForgeConfigPath(), config)
}

export async function loadProjectManifest(
  projectDir: string,
): Promise<ForgeProjectManifest | null> {
  return readJsonFile<ForgeProjectManifest>(path.join(projectDir, '.claude-forge.json'))
}

export async function saveProjectManifest(
  projectDir: string,
  manifest: ForgeProjectManifest,
): Promise<void> {
  await writeJsonFile(path.join(projectDir, '.claude-forge.json'), manifest)
}

export async function ensureLoggedIn(): Promise<ForgeGlobalConfig> {
  const config = await loadGlobalConfig()
  if (!config) {
    throw new Error('Not logged in. Run "claude-forge login" first.')
  }
  return config
}
