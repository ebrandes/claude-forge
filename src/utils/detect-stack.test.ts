import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { detectStack } from './detect-stack.js'

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'detect-stack-'))
}

async function writePackageJson(
  dir: string,
  deps: Record<string, string> = {},
  devDeps: Record<string, string> = {},
): Promise<void> {
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ dependencies: deps, devDependencies: devDeps }),
  )
}

describe('detectStack', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('returns empty result for empty directory', async () => {
    const result = await detectStack(tempDir)

    expect(result.framework).toBeNull()
    expect(result.language).toBeNull()
    expect(result.presetSuggestion).toBeNull()
    expect(result.dependencies).toEqual([])
    expect(result.hasTypeScript).toBe(false)
  })

  it('detects Next.js with TypeScript', async () => {
    await writePackageJson(tempDir, { next: '^14.0.0' }, { typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Next.js')
    expect(result.language).toBe('TypeScript')
    expect(result.presetSuggestion).toBe('next-app')
    expect(result.hasTypeScript).toBe(true)
  })

  it('detects Next.js with JavaScript', async () => {
    await writePackageJson(tempDir, { next: '^14.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Next.js')
    expect(result.language).toBe('JavaScript')
    expect(result.presetSuggestion).toBe('next-app')
  })

  it('detects Fastify', async () => {
    await writePackageJson(tempDir, { fastify: '^4.0.0' }, { typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Fastify')
    expect(result.presetSuggestion).toBe('fastify-api')
  })

  it('detects React Native', async () => {
    await writePackageJson(tempDir, { 'react-native': '^0.72.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('React Native')
    expect(result.presetSuggestion).toBe('react-native')
  })

  it('detects React with Vite', async () => {
    await writePackageJson(tempDir, { react: '^18.0.0' }, { vite: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('React (Vite)')
    expect(result.presetSuggestion).toBe('react-spa')
  })

  it('detects Flutter via pubspec.yaml', async () => {
    await writeFile(path.join(tempDir, 'pubspec.yaml'), 'name: my_app')

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Flutter')
    expect(result.language).toBe('Dart')
    expect(result.presetSuggestion).toBe('flutter-app')
  })

  it('detects monorepo via pnpm-workspace.yaml', async () => {
    await writePackageJson(tempDir, { react: '^18.0.0' }, { vite: '^5.0.0' })
    await writeFile(path.join(tempDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')

    const result = await detectStack(tempDir)

    expect(result.presetSuggestion).toBe('monorepo')
  })

  it('detects Express as Node.js API', async () => {
    await writePackageJson(tempDir, { express: '^4.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('Node.js API')
    expect(result.presetSuggestion).toBe('fastify-api')
  })

  it('detects Expo as React Native', async () => {
    await writePackageJson(tempDir, { expo: '^49.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBe('React Native')
    expect(result.presetSuggestion).toBe('react-native')
  })

  it('collects all dependencies', async () => {
    await writePackageJson(tempDir, { next: '^14.0.0', react: '^18.0.0' }, { typescript: '^5.0.0' })

    const result = await detectStack(tempDir)

    expect(result.dependencies).toContain('next')
    expect(result.dependencies).toContain('react')
    expect(result.dependencies).toContain('typescript')
  })

  it('detects monorepo via lerna.json', async () => {
    await writePackageJson(tempDir, { react: '^18.0.0' })
    await writeFile(path.join(tempDir, 'lerna.json'), '{}')

    const result = await detectStack(tempDir)

    expect(result.presetSuggestion).toBe('monorepo')
  })

  it('returns no framework when only devDeps exist', async () => {
    await writePackageJson(tempDir, {}, { eslint: '^8.0.0', prettier: '^3.0.0' })

    const result = await detectStack(tempDir)

    expect(result.framework).toBeNull()
    expect(result.presetSuggestion).toBeNull()
    expect(result.dependencies).toContain('eslint')
  })
})
