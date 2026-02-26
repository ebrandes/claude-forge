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

export function mergeWithExisting(newContent: string, existingContent: string): string {
  const existingUnmanaged = extractUnmanagedContent(existingContent)

  if (existingUnmanaged.length === 0) return newContent

  const unmanagedBlock = existingUnmanaged
    .filter((block) => !block.startsWith('# ') && block !== '---')
    .join('\n\n')

  if (!unmanagedBlock) return newContent

  return `${newContent}\n\n<!-- User custom content (preserved by forge) -->\n${unmanagedBlock}`
}
