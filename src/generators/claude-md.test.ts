import { generateClaudeMd } from './claude-md.js'

import type { SectionConfig, SectionParams } from '../types/index.js'

const defaultParams: SectionParams = {
  maxLinesPerFile: 400,
  idealLineRange: [100, 250],
  qualityLevel: 'strict',
  projectDescription: 'Test project',
  techStack: ['next-app'],
}

describe('generateClaudeMd', () => {
  it('generates markdown with header', () => {
    const result = generateClaudeMd([], defaultParams)

    expect(result).toContain('# 🤖 AI Project Guidelines (CLAUDE.md)')
    expect(result).toContain('clarity, performance, maintainability and scalability')
  })

  it('renders enabled sections', () => {
    const sections: SectionConfig[] = [{ sectionId: 'core-principles', enabled: true }]

    const result = generateClaudeMd(sections, defaultParams)

    expect(result).toContain('<!-- forge:start:core-principles -->')
    expect(result).toContain('<!-- forge:end:core-principles -->')
  })

  it('skips disabled sections', () => {
    const sections: SectionConfig[] = [
      { sectionId: 'core-principles', enabled: false },
      { sectionId: 'performance', enabled: true },
    ]

    const result = generateClaudeMd(sections, defaultParams)

    expect(result).not.toContain('forge:start:core-principles')
    expect(result).toContain('forge:start:performance')
  })

  it('renders multiple sections separated by dividers', () => {
    const sections: SectionConfig[] = [
      { sectionId: 'core-principles', enabled: true },
      { sectionId: 'performance', enabled: true },
    ]

    const result = generateClaudeMd(sections, defaultParams)

    expect(result).toContain('forge:start:core-principles')
    expect(result).toContain('forge:start:performance')
    expect(result).toContain('---')
  })

  it('ends with a newline', () => {
    const result = generateClaudeMd([], defaultParams)

    expect(result).toMatch(/\n$/)
  })

  it('renders custom content sections', () => {
    const sections: SectionConfig[] = [
      {
        sectionId: 'custom-section',
        enabled: true,
        customContent: '## Custom\nMy custom content',
      },
    ]

    const result = generateClaudeMd(sections, defaultParams)

    expect(result).toContain('## Custom')
    expect(result).toContain('My custom content')
  })
})
