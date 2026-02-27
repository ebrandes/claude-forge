import { readdir } from 'node:fs/promises'
import path from 'node:path'

import { readJsonFile, fileExists } from './fs.js'

export interface DetectedSubStack {
  path: string
  framework: string
  language: string
  tools: string[]
}

export interface DetectedStack {
  framework: string | null
  language: string | null
  presetSuggestion: string | null
  dependencies: string[]
  hasTypeScript: boolean
  substacks: DetectedSubStack[]
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface ComposerJson {
  require?: Record<string, string>
  'require-dev'?: Record<string, string>
}

export async function detectStack(projectDir: string): Promise<DetectedStack> {
  const result: DetectedStack = {
    framework: null,
    language: null,
    presetSuggestion: null,
    dependencies: [],
    hasTypeScript: false,
    substacks: [],
  }

  // Scan root directory
  const rootStack = await detectDirStack(projectDir, '.')
  if (rootStack) result.substacks.push(rootStack)

  // Scan 1 level of subdirectories
  const subdirs = await getSubdirectories(projectDir)
  for (const dir of subdirs) {
    const sub = await detectDirStack(path.join(projectDir, dir), dir)
    if (sub) result.substacks.push(sub)
  }

  // Set top-level fields from substacks (backwards compat)
  if (result.substacks.length > 0) {
    const primary = result.substacks[0]
    result.framework = primary.framework
    result.language = primary.language
  }

  // Collect dependencies from root package.json (backwards compat)
  const rootPkg = await readJsonFile<PackageJson>(path.join(projectDir, 'package.json'))
  if (rootPkg) {
    const allRootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies }
    result.dependencies = Object.keys(allRootDeps)
    result.hasTypeScript = 'typescript' in allRootDeps
  }

  // Check for workspace files (monorepo override)
  const hasWorkspaces =
    (await fileExists(path.join(projectDir, 'pnpm-workspace.yaml'))) ||
    (await fileExists(path.join(projectDir, 'lerna.json')))

  result.presetSuggestion = hasWorkspaces ? 'monorepo' : resolvePresetSuggestion(result)
  return result
}

async function detectDirStack(
  dirPath: string,
  relativePath: string,
): Promise<DetectedSubStack | null> {
  const phpStack = await detectPhpStack(dirPath, relativePath)
  if (phpStack) return phpStack

  const dartStack = await detectDartStack(dirPath, relativePath)
  if (dartStack) return dartStack

  return await detectJsStack(dirPath, relativePath)
}

async function detectPhpStack(
  dirPath: string,
  relativePath: string,
): Promise<DetectedSubStack | null> {
  const composerPath = path.join(dirPath, 'composer.json')
  const composer = await readJsonFile<ComposerJson>(composerPath)
  if (!composer) return null

  const allDeps = { ...composer.require, ...composer['require-dev'] }
  const depKeys = Object.keys(allDeps)
  const hasArtisan = await fileExists(path.join(dirPath, 'artisan'))

  let framework = 'PHP'
  if (hasArtisan || depKeys.some((d) => d.startsWith('laravel/'))) {
    framework = 'Laravel'
  } else if (depKeys.some((d) => d.startsWith('symfony/'))) {
    framework = 'Symfony'
  }

  const tools = await detectPhpTools(dirPath, depKeys)
  return { path: relativePath, framework, language: 'PHP', tools }
}

async function detectPhpTools(dirPath: string, depKeys: string[]): Promise<string[]> {
  const tools: string[] = []

  const hasPhpStan =
    (await fileExists(path.join(dirPath, 'phpstan.neon'))) ||
    (await fileExists(path.join(dirPath, 'phpstan.neon.dist')))
  if (hasPhpStan || depKeys.includes('phpstan/phpstan')) tools.push('phpstan')

  if (depKeys.includes('pestphp/pest')) tools.push('pest')
  else if (depKeys.includes('phpunit/phpunit')) tools.push('phpunit')

  const hasPint =
    (await fileExists(path.join(dirPath, 'pint.json'))) || depKeys.includes('laravel/pint')
  if (hasPint) tools.push('pint')

  const hasCsFixer =
    (await fileExists(path.join(dirPath, '.php-cs-fixer.php'))) ||
    (await fileExists(path.join(dirPath, '.php-cs-fixer.dist.php'))) ||
    depKeys.includes('friendsofphp/php-cs-fixer')
  if (hasCsFixer) tools.push('php-cs-fixer')

  return tools
}

async function detectDartStack(
  dirPath: string,
  relativePath: string,
): Promise<DetectedSubStack | null> {
  if (!(await fileExists(path.join(dirPath, 'pubspec.yaml')))) return null
  return { path: relativePath, framework: 'Flutter', language: 'Dart', tools: [] }
}

async function detectJsStack(
  dirPath: string,
  relativePath: string,
): Promise<DetectedSubStack | null> {
  const pkg = await readJsonFile<PackageJson>(path.join(dirPath, 'package.json'))
  if (!pkg) return null

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  const depKeys = Object.keys(allDeps)
  const hasTs = depKeys.includes('typescript')
  const lang = hasTs ? 'TypeScript' : 'JavaScript'

  let framework: string | null = null
  if (depKeys.includes('next')) {
    framework = 'Next.js'
  } else if (depKeys.includes('fastify')) {
    framework = 'Fastify'
  } else if (depKeys.includes('react-native') || depKeys.includes('expo')) {
    framework = 'React Native'
  } else if (depKeys.includes('react') && depKeys.includes('vite')) {
    framework = 'React (Vite)'
  } else if (depKeys.includes('vue') && depKeys.includes('vite')) {
    framework = 'Vue (Vite)'
  } else if (depKeys.includes('vite')) {
    framework = 'Vite'
  } else if (depKeys.includes('react')) {
    framework = 'React'
  } else if (depKeys.includes('express') || depKeys.includes('hono') || depKeys.includes('koa')) {
    framework = 'Node.js API'
  }

  // No known framework detected — skip unless there are runtime dependencies
  if (!framework) {
    const hasRuntimeDeps = pkg.dependencies && Object.keys(pkg.dependencies).length > 0
    if (!hasRuntimeDeps) return null
    framework = 'Node.js'
  }

  const tools = detectJsTools(depKeys)
  return { path: relativePath, framework, language: lang, tools }
}

function detectJsTools(depKeys: string[]): string[] {
  const tools: string[] = []
  if (depKeys.includes('typescript')) tools.push('typescript')
  if (depKeys.includes('eslint')) tools.push('eslint')
  if (depKeys.includes('vitest')) tools.push('vitest')
  if (depKeys.includes('jest')) tools.push('jest')
  if (depKeys.includes('prettier')) tools.push('prettier')
  return tools
}

function resolvePresetSuggestion(result: DetectedStack): string | null {
  const { substacks } = result
  if (substacks.length === 0) return null

  const hasPhp = substacks.some((s) => s.language === 'PHP')
  const hasJs = substacks.some((s) => s.language === 'TypeScript' || s.language === 'JavaScript')
  const hasDart = substacks.some((s) => s.language === 'Dart')

  // Multi-stack: PHP + JS/TS
  if (hasPhp && hasJs) return 'php-vite'

  // Single PHP
  if (hasPhp) return 'php-api'

  // Single Dart
  if (hasDart) return 'flutter-app'

  // Check workspaces (monorepo)
  if (substacks.length > 1) return 'monorepo'

  // Single JS/TS — match by framework
  const jsStack = substacks.find((s) => s.language === 'TypeScript' || s.language === 'JavaScript')
  if (!jsStack) return null

  switch (jsStack.framework) {
    case 'Next.js': {
      return 'next-app'
    }
    case 'Fastify':
    case 'Node.js API': {
      return 'fastify-api'
    }
    case 'React Native': {
      return 'react-native'
    }
    case 'React (Vite)':
    case 'Vue (Vite)':
    case 'Vite':
    case 'React': {
      return 'react-spa'
    }
    default: {
      return 'node-lib'
    }
  }
}

async function getSubdirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    return entries
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith('.') &&
          e.name !== 'node_modules' &&
          e.name !== 'vendor' &&
          e.name !== 'dist' &&
          e.name !== 'build',
      )
      .map((e) => e.name)
  } catch {
    return []
  }
}
