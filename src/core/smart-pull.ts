import { cp } from 'node:fs/promises'
import path from 'node:path'

import { readTextFile, writeTextFile, ensureDir, fileExists } from '../utils/fs.js'

import { hasForgeMarkers, smartMergeMarkdown } from './template-engine.js'

export type PullFileResult = 'merged' | 'copied' | 'unchanged' | 'skipped'

export async function smartPullFile(
  remotePath: string,
  localPath: string,
): Promise<PullFileResult> {
  if (!(await fileExists(remotePath))) return 'skipped'

  const remoteContent = await readTextFile(remotePath)
  if (remoteContent === null) return 'skipped'

  const localContent = await readTextFile(localPath)

  // Smart merge: only when local exists AND remote has forge markers
  if (localContent !== null && hasForgeMarkers(remoteContent)) {
    const merged = smartMergeMarkdown(remoteContent, localContent)
    if (merged === localContent) return 'unchanged'

    await ensureDir(path.dirname(localPath))
    await writeTextFile(localPath, merged)
    return 'merged'
  }

  // Fallback: full copy (new files or files without forge markers)
  await ensureDir(path.dirname(localPath))
  await cp(remotePath, localPath, { recursive: true })
  return 'copied'
}
