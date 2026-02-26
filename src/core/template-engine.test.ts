import {
  renderSection,
  wrapWithMarkers,
  extractManagedSections,
  extractUnmanagedContent,
  mergeWithExisting,
} from './template-engine.js'

import type { SectionConfig, SectionParams } from '../types/index.js'

const defaultParams: SectionParams = {
  maxLinesPerFile: 400,
  idealLineRange: [100, 250],
  qualityLevel: 'strict',
  projectDescription: 'Test project',
  techStack: ['next-app'],
}

describe('wrapWithMarkers', () => {
  it('wraps content with forge markers', () => {
    const result = wrapWithMarkers('test-section', '## Test\nContent here')

    expect(result).toContain('<!-- forge:start:test-section -->')
    expect(result).toContain('<!-- forge:end:test-section -->')
    expect(result).toContain('## Test\nContent here')
  })

  it('places markers on separate lines', () => {
    const result = wrapWithMarkers('my-id', 'body')
    const lines = result.split('\n')

    expect(lines[0]).toBe('<!-- forge:start:my-id -->')
    expect(lines[1]).toBe('body')
    expect(lines[2]).toBe('<!-- forge:end:my-id -->')
  })
})

describe('extractManagedSections', () => {
  it('extracts sections from markdown', () => {
    const markdown = [
      '# Header',
      '<!-- forge:start:section-a -->',
      'Content A',
      '<!-- forge:end:section-a -->',
      '',
      '<!-- forge:start:section-b -->',
      'Content B',
      '<!-- forge:end:section-b -->',
    ].join('\n')

    const sections = extractManagedSections(markdown)

    expect(sections.size).toBe(2)
    expect(sections.get('section-a')).toBe('Content A')
    expect(sections.get('section-b')).toBe('Content B')
  })

  it('returns empty map when no sections exist', () => {
    const sections = extractManagedSections('# Just a header\nSome content')

    expect(sections.size).toBe(0)
  })

  it('handles multiline section content', () => {
    const markdown = [
      '<!-- forge:start:multi -->',
      'Line 1',
      'Line 2',
      'Line 3',
      '<!-- forge:end:multi -->',
    ].join('\n')

    const sections = extractManagedSections(markdown)

    expect(sections.get('multi')).toBe('Line 1\nLine 2\nLine 3')
  })
})

describe('extractUnmanagedContent', () => {
  it('extracts content outside forge markers', () => {
    const markdown = [
      'Custom header',
      '<!-- forge:start:section-a -->',
      'Managed content',
      '<!-- forge:end:section-a -->',
      'Custom footer',
    ].join('\n')

    const unmanaged = extractUnmanagedContent(markdown)

    expect(unmanaged).toContain('Custom header')
    expect(unmanaged).toContain('Custom footer')
  })

  it('returns empty array when all content is managed', () => {
    const markdown = [
      '<!-- forge:start:all -->',
      'Everything managed',
      '<!-- forge:end:all -->',
    ].join('\n')

    const unmanaged = extractUnmanagedContent(markdown)

    expect(unmanaged).toHaveLength(0)
  })
})

describe('mergeWithExisting', () => {
  it('returns new content when existing has no unmanaged content', () => {
    const newContent = 'New stuff'
    const existing = [
      '<!-- forge:start:section -->',
      'Old stuff',
      '<!-- forge:end:section -->',
    ].join('\n')

    const result = mergeWithExisting(newContent, existing)

    expect(result).toBe('New stuff')
  })

  it('preserves custom content from existing file', () => {
    const newContent = 'New managed content'
    const existing = [
      '<!-- forge:start:section -->',
      'Old managed',
      '<!-- forge:end:section -->',
      'My custom notes that should be preserved',
    ].join('\n')

    const result = mergeWithExisting(newContent, existing)

    expect(result).toContain('New managed content')
    expect(result).toContain('My custom notes that should be preserved')
    expect(result).toContain('<!-- User custom content (preserved by forge) -->')
  })

  it('filters out header-only unmanaged content', () => {
    const newContent = 'New content'
    const existing = [
      '# Header Only',
      '---',
      '<!-- forge:start:section -->',
      'Managed',
      '<!-- forge:end:section -->',
    ].join('\n')

    const result = mergeWithExisting(newContent, existing)

    expect(result).toBe('New content')
  })
})

describe('renderSection', () => {
  it('returns null for disabled sections', () => {
    const config: SectionConfig = {
      sectionId: 'core-principles',
      enabled: false,
    }

    const result = renderSection(config, defaultParams)

    expect(result).toBeNull()
  })

  it('renders custom content when provided', () => {
    const config: SectionConfig = {
      sectionId: 'custom',
      enabled: true,
      customContent: '## My Custom Section\nCustom content here',
    }

    const result = renderSection(config, defaultParams)

    expect(result).toContain('<!-- forge:start:custom -->')
    expect(result).toContain('## My Custom Section')
    expect(result).toContain('<!-- forge:end:custom -->')
  })

  it('returns null for unknown section id', () => {
    const config: SectionConfig = {
      sectionId: 'nonexistent-section-id',
      enabled: true,
    }

    const result = renderSection(config, defaultParams)

    expect(result).toBeNull()
  })

  it('renders a known section with params', () => {
    const config: SectionConfig = {
      sectionId: 'core-principles',
      enabled: true,
    }

    const result = renderSection(config, defaultParams)

    expect(result).not.toBeNull()
    expect(result).toContain('<!-- forge:start:core-principles -->')
    expect(result).toContain('<!-- forge:end:core-principles -->')
  })
})
