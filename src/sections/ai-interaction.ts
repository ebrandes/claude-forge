import type { Section } from '../types/index.js'

export const aiInteractionSection: Section = {
  id: 'ai-interaction',
  title: 'AI Interaction Rules',
  emoji: '🧠',
  order: 120,
  render(params) {
    const max = params.maxLinesPerFile ?? 400

    return `## 🧠 AI Interaction Rules

When generating or modifying code, the AI must:

1. Respect **all rules in this file**
2. Never exceed **${max} lines per file**
3. Prefer **incremental changes** — one concern per edit
4. Explain architectural decisions briefly
5. Ask before introducing new libraries or patterns
6. **Never refactor unrelated code**
7. Check existing utils before creating any new utility function

### Task Completion Protocol (MANDATORY)

A task is **NOT complete** until the AI has verified:
1. **Types** — \`npx tsc --noEmit\` passes with zero errors
2. **Build** — \`npm run build\` succeeds
3. **Lint** — No ESLint errors in modified files
4. **Clean** — No unused imports, variables, dead code, console.logs
5. **Review** — Re-read every changed file top to bottom
6. **Test** — Affected tests still pass (if applicable)

**If any check fails → fix it before declaring the task complete.**
Never say "done" with known broken code.

### Checklist before committing
- [ ] File < ${max} lines
- [ ] CSS is responsive (mobile-first or desktop-first as specified)
- [ ] No duplicated code (especially formatting → use centralized utils)
- [ ] Heavy components are lazy loaded
- [ ] No \`any\` in types
- [ ] Hooks extracted for logic > 50 lines
- [ ] Images use \`next/image\` (web projects)
- [ ] Clean code: no unused imports/variables/functions
- [ ] No console.logs
- [ ] No commented-out code (dead code)
- [ ] Descriptive and explicit names
- [ ] Error states handled (loading, error, empty)`
  },
}
