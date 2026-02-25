import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { ensureLoggedIn } from './config.js'
import {
  gitClone,
  gitPull,
  gitAddAll,
  gitCommit,
  gitPush,
  gitHasChanges,
  exec,
} from '../utils/git.js'
import {
  ensureDir,
  readTextFile,
  writeTextFile,
  listFiles,
  fileExists,
} from '../utils/fs.js'
import { log } from '../utils/logger.js'

export class GitHubSync {
  private repoDir: string = ''
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    const config = await ensureLoggedIn()
    this.repoDir = config.localRepoPath

    if (!existsSync(this.repoDir)) {
      log.step('Cloning sync repo...')
      await ensureDir(this.repoDir)
      await gitClone(config.repoUrl, this.repoDir)
    }

    this.initialized = true
  }

  async pull(): Promise<void> {
    await this.init()
    try {
      await gitPull(this.repoDir)
    } catch {
      log.warn('Pull failed — repo might be empty or have no remote commits')
    }
  }

  async commitAndPush(message: string): Promise<void> {
    await this.init()
    await gitAddAll(this.repoDir)

    if (!await gitHasChanges(this.repoDir)) {
      log.dim('No changes to push')
      return
    }

    await gitCommit(this.repoDir, message)
    await gitPush(this.repoDir)
  }

  async readFile(relativePath: string): Promise<string | null> {
    await this.init()
    return readTextFile(join(this.repoDir, relativePath))
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    await this.init()
    await writeTextFile(join(this.repoDir, relativePath), content)
  }

  async copyToRepo(sourcePath: string, repoRelativePath: string): Promise<void> {
    await this.init()
    const destPath = join(this.repoDir, repoRelativePath)
    await ensureDir(join(destPath, '..'))
    await cp(sourcePath, destPath, { recursive: true })
  }

  async copyFromRepo(repoRelativePath: string, destPath: string): Promise<void> {
    await this.init()
    const sourcePath = join(this.repoDir, repoRelativePath)
    if (!await fileExists(sourcePath)) {
      throw new Error(`File not found in sync repo: ${repoRelativePath}`)
    }
    await ensureDir(join(destPath, '..'))
    await cp(sourcePath, destPath, { recursive: true })
  }

  async listDirectory(relativePath: string): Promise<string[]> {
    await this.init()
    return listFiles(join(this.repoDir, relativePath))
  }

  async fileExistsInRepo(relativePath: string): Promise<boolean> {
    await this.init()
    return fileExists(join(this.repoDir, relativePath))
  }

  getRepoDir(): string {
    return this.repoDir
  }
}
