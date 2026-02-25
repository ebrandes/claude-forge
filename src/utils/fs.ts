import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { constants } from 'node:fs'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath))
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await ensureDir(dirname(filePath))
  await writeFile(filePath, content, 'utf-8')
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}

export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    return await readdir(dirPath)
  } catch {
    return []
  }
}

export async function listFilesRecursive(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const results: string[] = []

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        const nested = await listFilesRecursive(fullPath)
        results.push(...nested)
      } else {
        results.push(fullPath)
      }
    }

    return results
  } catch {
    return []
  }
}

export function getForgeDir(): string {
  return join(homedir(), '.claude-forge')
}

export function getForgeRepoDir(): string {
  return join(getForgeDir(), 'repo')
}

export function getForgeConfigPath(): string {
  return join(getForgeDir(), 'config.json')
}

function homedir(): string {
  return process.env.HOME || process.env.USERPROFILE || '~'
}
