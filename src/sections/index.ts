import { accessibilitySection } from './accessibility.js'
import { aiInteractionSection } from './ai-interaction.js'
import { architectureSection } from './architecture.js'
import { avoidListSection } from './avoid-list.js'
import { bugPreventionSection } from './bug-prevention.js'
import { codeStyleSection } from './code-style.js'
import { componentsFunctionsSection } from './components-functions.js'
import { corePrinciplesSection } from './core-principles.js'
import { errorHandlingSection } from './error-handling.js'
import { fileSizeRulesSection } from './file-size-rules.js'
import { implementationProtocolSection } from './implementation-protocol.js'
import { namingConventionsSection } from './naming-conventions.js'
import { performanceSection } from './performance.js'
import { responsiveDesignSection } from './responsive-design.js'
import { stateManagementSection } from './state-management.js'
import { testingSection } from './testing.js'

import type { Section } from '../types/index.js'

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

export const sectionRegistry = new Map<string, Section>(sections.map((s) => [s.id, s]))

export function getAllSections(): Section[] {
  // eslint-disable-next-line unicorn/no-array-sort -- toSorted requires ES2023+, project targets ES2022
  return [...sections].sort((a, b) => a.order - b.order)
}

export function getSectionIds(): string[] {
  return sections.map((s) => s.id)
}
