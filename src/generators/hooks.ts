import path from 'node:path'

import { getHookTemplate } from '../hooks-library/index.js'
import { writeTextFile, ensureDir } from '../utils/fs.js'
import { log } from '../utils/logger.js'

export async function generateHooks(projectDir: string, enabledHooks: string[]): Promise<void> {
  if (enabledHooks.length === 0) return

  const hooksDir = path.join(projectDir, '.claude', 'hooks')
  await ensureDir(hooksDir)

  for (const hookId of enabledHooks) {
    const template = getHookTemplate(hookId)
    if (!template) {
      log.warn(`Hook template not found: ${hookId}`)
      continue
    }

    const filePath = path.join(hooksDir, `${hookId}.sh`)
    await writeTextFile(filePath, template.script)
    log.file('Created', `.claude/hooks/${hookId}.sh`)
  }
}
