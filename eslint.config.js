import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
import importX from 'eslint-plugin-import-x'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript strict + stylistic (type-aware)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Parser options for type-aware linting
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Import plugin — organized imports, no circular deps
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  // Import resolver for TypeScript (.js extension imports)
  {
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  // Unicorn — modern Node.js best practices
  unicorn.configs['flat/recommended'],

  // Prettier — disables conflicting formatting rules
  prettier,

  // Custom rules
  {
    rules: {
      // --- TypeScript strict ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Relax some overly strict rules for CLI context
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: false,
        },
      ],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],

      // --- Import organization ---
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',

      // --- Unicorn tweaks ---
      'unicorn/prevent-abbreviations': 'off', // too aggressive for CLI tools
      'unicorn/no-process-exit': 'off', // CLIs need process.exit
      'unicorn/no-null': 'off', // APIs return null
      'unicorn/prefer-top-level-await': 'off', // not always applicable

      // --- General quality ---
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },

  // Allow console in CLI layer (logger, commands, generators, prompts, entry)
  {
    files: [
      'src/utils/logger.ts',
      'src/commands/**/*.ts',
      'src/generators/**/*.ts',
      'src/prompts/**/*.ts',
      'bin/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },

  // Test files — relaxed rules
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'max-lines': 'off',
    },
  },
)
