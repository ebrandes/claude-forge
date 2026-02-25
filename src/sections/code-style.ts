import type { Section } from '../types/index.js'

export const codeStyleSection: Section = {
  id: 'code-style',
  title: 'Code Style & Clean Code',
  emoji: '🧼',
  order: 100,
  render() {
    return `## 🧼 Code Style & Clean Code

- Prefer clarity over clever tricks
- Avoid deep nesting
- Avoid magic numbers — use named constants
- Prefer early returns
- Keep conditionals readable

### Clean Code (MANDATORY)

**NEVER leave dirty code:**
- Remove unused imports
- Remove unused variables and functions
- Remove debug console.logs
- Remove commented-out code (dead code)
- Remove obsolete comments

\`\`\`typescript
// ❌ Dirty code
import { useState, useEffect, useCallback } from 'react' // useCallback unused
const unused = 'test'
// const oldCode = 'removed'
console.log('debug')

// ✅ Clean code
import { useState, useEffect } from 'react'
\`\`\`

### DRY — No duplication (MANDATORY)

- Copy/paste > 3 lines → create function/component
- Repeated logic in 2+ places → extract to hook/util
- Similar types → use generics or extends
- **NEVER create local utility functions** when a centralized version exists`
  },
}
