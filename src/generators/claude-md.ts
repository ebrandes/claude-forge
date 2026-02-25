import type { SectionConfig, SectionParams } from '../types/index.js'
import { renderSection } from '../core/template-engine.js'

const HEADER = `# 🤖 AI Project Guidelines (CLAUDE.md)

This file defines **non-negotiable rules and preferences** for AI assistance in this project.
The goal is **clarity, performance, maintainability and scalability**.`

export function generateClaudeMd(
  sections: SectionConfig[],
  params: SectionParams,
): string {
  const renderedSections = sections
    .filter(s => s.enabled)
    .map(s => renderSection(s, params))
    .filter((s): s is string => s !== null)

  const parts = [HEADER, '---', renderedSections.join('\n\n---\n\n')]

  return parts.join('\n\n') + '\n'
}
