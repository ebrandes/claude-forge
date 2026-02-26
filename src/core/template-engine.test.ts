import {
  renderSection,
  wrapWithMarkers,
  extractManagedSections,
  extractUnmanagedContent,
  hasForgeMarkers,
  smartMergeMarkdown,
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

describe('hasForgeMarkers', () => {
  it('returns true when content has forge markers', () => {
    const content = '# Header\n<!-- forge:start:test -->\nContent\n<!-- forge:end:test -->'
    expect(hasForgeMarkers(content)).toBe(true)
  })

  it('returns false for plain markdown', () => {
    expect(hasForgeMarkers('# Just a header\nSome content')).toBe(false)
  })
})

describe('smartMergeMarkdown', () => {
  it('updates managed sections from remote', () => {
    const remote = '<!-- forge:start:a -->\nNew A\n<!-- forge:end:a -->'
    const local = '<!-- forge:start:a -->\nOld A\n<!-- forge:end:a -->'

    const result = smartMergeMarkdown(remote, local)

    expect(result).toContain('New A')
    expect(result).not.toContain('Old A')
  })

  it('preserves unmanaged content from local', () => {
    const remote = '<!-- forge:start:a -->\nNew A\n<!-- forge:end:a -->'
    const local = [
      'My custom header',
      '<!-- forge:start:a -->',
      'Old A',
      '<!-- forge:end:a -->',
      'My custom footer',
    ].join('\n')

    const result = smartMergeMarkdown(remote, local)

    expect(result).toContain('My custom header')
    expect(result).toContain('My custom footer')
    expect(result).toContain('New A')
  })

  it('preserves local-only managed sections', () => {
    const remote = '<!-- forge:start:a -->\nRemote A\n<!-- forge:end:a -->'
    const local = [
      '<!-- forge:start:a -->',
      'Old A',
      '<!-- forge:end:a -->',
      '\n',
      '<!-- forge:start:local-only -->',
      'My local section',
      '<!-- forge:end:local-only -->',
    ].join('\n')

    const result = smartMergeMarkdown(remote, local)

    expect(result).toContain('Remote A')
    expect(result).toContain('My local section')
    expect(result).toContain('forge:start:local-only')
  })

  it('adds new remote sections not in local', () => {
    const remote = [
      '<!-- forge:start:a -->',
      'A content',
      '<!-- forge:end:a -->',
      '\n',
      '<!-- forge:start:new-section -->',
      'Brand new',
      '<!-- forge:end:new-section -->',
    ].join('\n')
    const local = '<!-- forge:start:a -->\nOld A\n<!-- forge:end:a -->'

    const result = smartMergeMarkdown(remote, local)

    expect(result).toContain('A content')
    expect(result).toContain('Brand new')
    expect(result).toContain('forge:start:new-section')
  })

  it('handles local file with no markers (all content is custom)', () => {
    const remote = '<!-- forge:start:a -->\nManaged\n<!-- forge:end:a -->'
    const local = '# My Manual CLAUDE.md\n\nCustom rules here'

    const result = smartMergeMarkdown(remote, local)

    expect(result).toContain('Managed')
    expect(result).toContain('# My Manual CLAUDE.md')
    expect(result).toContain('Custom rules here')
    expect(result).toContain('<!-- User custom content (preserved by forge) -->')
  })

  it('preserves section order from local file', () => {
    const remote = [
      '<!-- forge:start:b -->',
      'New B',
      '<!-- forge:end:b -->',
      '\n',
      '<!-- forge:start:a -->',
      'New A',
      '<!-- forge:end:a -->',
    ].join('\n')
    const local = [
      '<!-- forge:start:a -->',
      'Old A',
      '<!-- forge:end:a -->',
      '\n---\n',
      '<!-- forge:start:b -->',
      'Old B',
      '<!-- forge:end:b -->',
    ].join('\n')

    const result = smartMergeMarkdown(remote, local)

    const indexA = result.indexOf('forge:start:a')
    const indexB = result.indexOf('forge:start:b')
    expect(indexA).toBeLessThan(indexB)
  })

  it('returns identical content when remote sections match local', () => {
    const content = [
      '# Header',
      '<!-- forge:start:a -->',
      'Same content',
      '<!-- forge:end:a -->',
      'Footer',
    ].join('\n')

    const result = smartMergeMarkdown(content, content)

    expect(result).toBe(content)
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
