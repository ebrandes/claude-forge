import type { Section } from '../types/index.js'
import { corePrinciplesSection } from './core-principles.js'
import { fileSizeRulesSection } from './file-size-rules.js'
import { responsiveDesignSection } from './responsive-design.js'
import { performanceSection } from './performance.js'
import { architectureSection } from './architecture.js'
import { stateManagementSection } from './state-management.js'
import { componentsFunctionsSection } from './components-functions.js'
import { namingConventionsSection } from './naming-conventions.js'
import { errorHandlingSection } from './error-handling.js'
import { codeStyleSection } from './code-style.js'
import { accessibilitySection } from './accessibility.js'
import { aiInteractionSection } from './ai-interaction.js'
import { avoidListSection } from './avoid-list.js'
import { bugPreventionSection } from './bug-prevention.js'
import { implementationProtocolSection } from './implementation-protocol.js'
import { testingSection } from './testing.js'

const sections: Section[] = [
  corePrinciplesSection,
  fileSizeRulesSection,
  responsiveDesignSection,
  performanceSection,
  architectureSection,
  stateManagementSection,
  componentsFunctionsSection,
  namingConventionsSection,
  bugPreventionSection,
  testingSection,
  errorHandlingSection,
  codeStyleSection,
  accessibilitySection,
  implementationProtocolSection,
  aiInteractionSection,
  avoidListSection,
]

export const sectionRegistry = new Map<string, Section>(
  sections.map(s => [s.id, s]),
)

export function getAllSections(): Section[] {
  return [...sections].sort((a, b) => a.order - b.order)
}

export function getSectionIds(): string[] {
  return sections.map(s => s.id)
}
