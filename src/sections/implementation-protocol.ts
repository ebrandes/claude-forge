import type { Section } from '../types/index.js'

export const implementationProtocolSection: Section = {
  id: 'implementation-protocol',
  title: 'Implementation Protocol',
  emoji: '🔄',
  order: 115,
  render(params) {
    const quality = params.qualityLevel ?? 'strict'

    const strictBlock = quality === 'strict' ? `

### Completion Criteria (MANDATORY)
A task is ONLY considered complete when ALL of the following are true:
- [ ] TypeScript compiles with zero errors (\`npx tsc --noEmit\`)
- [ ] Build succeeds (\`npm run build\`)
- [ ] No ESLint errors
- [ ] No unused imports, variables, or dead code
- [ ] All affected test files pass
- [ ] Visual output matches expected behavior (if UI change)

**NEVER declare a task complete if any check fails.**
If a check fails, fix the issue and verify again.` : ''

    return `## 🔄 Implementation Protocol

### Step 1: Understand before coding
- Read existing code in the affected files
- Identify all files that will be impacted
- Check for existing utils/hooks that solve part of the problem

### Step 2: Implement incrementally
- Make the **smallest change** that solves the problem
- One concern per commit — don't mix unrelated changes
- Prefer modifying existing files over creating new ones

### Step 3: Verify after every change
- Run type check after each file edit
- Build the project to catch runtime issues
- Check that no existing functionality is broken

### Step 4: Self-review before finishing
- Re-read every changed file from top to bottom
- Verify no \`any\` types, no unused code, no console.logs
- Confirm the change actually solves the original problem${strictBlock}`
  },
}
