import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface ExecResult {
  stdout: string
  stderr: string
}

export async function exec(command: string, args: string[], cwd?: string): Promise<ExecResult> {
  const result = await execFileAsync(command, args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim() }
}

export async function execInteractive(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

export async function isGhInstalled(): Promise<boolean> {
  try {
    await exec('gh', ['--version'])
    return true
  } catch {
    return false
  }
}

export async function isGhAuthenticated(): Promise<boolean> {
  try {
    const result = await exec('gh', ['auth', 'status'])
    return result.stdout.includes('Logged in') || result.stderr.includes('Logged in')
  } catch {
    return false
  }
}

export async function ghRepoExists(owner: string, name: string): Promise<boolean> {
  try {
    await exec('gh', ['repo', 'view', `${owner}/${name}`])
    return true
  } catch {
    return false
  }
}

export async function ghCreatePrivateRepo(owner: string, name: string): Promise<void> {
  await exec('gh', ['repo', 'create', `${owner}/${name}`, '--private', '--confirm'])
}

export async function gitClone(repoUrl: string, targetDir: string): Promise<void> {
  await exec('git', ['clone', repoUrl, targetDir])
}

export async function gitPull(repoDir: string): Promise<void> {
  await exec('git', ['pull', '--rebase'], repoDir)
}

export async function gitAddAll(repoDir: string): Promise<void> {
  await exec('git', ['add', '-A'], repoDir)
}

export async function gitCommit(repoDir: string, message: string): Promise<void> {
  await exec('git', ['commit', '-m', message], repoDir)
}

export async function gitPush(repoDir: string): Promise<void> {
  await exec('git', ['push'], repoDir)
}

export async function gitHasChanges(repoDir: string): Promise<boolean> {
  const result = await exec('git', ['status', '--porcelain'], repoDir)
  return result.stdout.length > 0
}
