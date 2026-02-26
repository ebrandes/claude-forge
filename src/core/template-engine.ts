import { sectionRegistry } from '../sections/index.js'

import type { SectionConfig, SectionParams } from '../types/index.js'

const FORGE_START = (id: string) => `<!-- forge:start:${id} -->`
const FORGE_END = (id: string) => `<!-- forge:end:${id} -->`

export function renderSection(config: SectionConfig, params: SectionParams): string | null {
  if (!config.enabled) return null

  if (config.customContent) {
    return wrapWithMarkers(config.sectionId, config.customContent)
  }

  const section = sectionRegistry.get(config.sectionId)
  if (!section) return null

  const mergedParams = { ...params, ...config.overrides }
  const content = section.render(mergedParams)
  return wrapWithMarkers(config.sectionId, content)
}

export function wrapWithMarkers(sectionId: string, content: string): string {
  return `${FORGE_START(sectionId)}\n${content}\n${FORGE_END(sectionId)}`
}

export function extractManagedSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>()
  const regex = /<!-- forge:start:(\S+) -->\n([\s\S]*?)\n<!-- forge:end:\1 -->/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(markdown)) !== null) {
    sections.set(match[1], match[2])
  }

  return sections
}

export function extractUnmanagedContent(markdown: string): string[] {
  const parts = markdown.split(/<!-- forge:start:\S+ -->[\s\S]*?<!-- forge:end:\S+ -->/)
  return parts.map((p) => p.trim()).filter((p) => p.length > 0)
}

export function hasForgeMarkers(content: string): boolean {
  return content.includes('<!-- forge:start:')
}

export function smartMergeMarkdown(remoteContent: string, localContent: string): string {
  const remoteSections = extractManagedSections(remoteContent)
  const localSections = extractManagedSections(localContent)

  // If local has no markers, treat entire local content as custom
  if (localSections.size === 0) {
    const trimmed = localContent.trim()
    if (!trimmed) return remoteContent
    return `${remoteContent}\n\n<!-- User custom content (preserved by forge) -->\n${trimmed}`
  }

  const placedRemoteSections = new Set<string>()
  const forgeBlockRegex = /<!-- forge:start:(\S+) -->\n[\s\S]*?\n<!-- forge:end:\1 -->/g

  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = forgeBlockRegex.exec(localContent)) !== null) {
    const sectionId = match[1]

    // Keep unmanaged content before this block
    result += localContent.slice(lastIndex, match.index)

    const remoteVersion = remoteSections.get(sectionId)
    if (remoteVersion === undefined) {
      // Local-only section: preserve as-is
      result += match[0]
    } else {
      result += wrapWithMarkers(sectionId, remoteVersion)
      placedRemoteSections.add(sectionId)
    }

    lastIndex = match.index + match[0].length
  }

  // Append remaining content after the last block
  result += localContent.slice(lastIndex)

  // Append new remote sections that don't exist in local
  for (const [sectionId, content] of remoteSections) {
    if (!localSections.has(sectionId) && !placedRemoteSections.has(sectionId)) {
      result += `\n\n---\n\n${wrapWithMarkers(sectionId, content)}`
    }
  }

  return result
}
