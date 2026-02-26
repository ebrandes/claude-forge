# 🤖 AI Project Guidelines (CLAUDE.md)

This file defines **non-negotiable rules and preferences** for AI assistance in this project.
The goal is **clarity, performance, maintainability and scalability**.

---

<!-- forge:start:core-principles -->
## 🎯 Core Principles

1. **Performance first**
2. **Responsive design** (context-aware)
3. **Simplicity > cleverness**
4. **Readable code > short code**
5. **Explicit > implicit**
6. **Small files, small components**
7. **No premature abstractions**
<!-- forge:end:core-principles -->

---

<!-- forge:start:file-size-rules -->
## 📏 File & Code Size Rules (VERY IMPORTANT)

- **Max 400 lines per file** (hard limit)
- Ideal target: **100–250 lines**
- Components React: ~300 lines max (including imports)
- Services/Utils: ~400 lines max

**Splitting strategy:**
```
Component grande → Extract sub-components
Service grande   → Split by responsibility
Hook complexo    → Split into smaller hooks
Types extensos   → Separate by domain
```

❌ Never create "god files"
✅ Prefer many small, focused files
<!-- forge:end:file-size-rules -->

---

<!-- forge:start:performance -->
## ⚡ Performance First Rules

- Avoid unnecessary re-renders, effects, state and network requests
- Prefer Server Components (default in Next.js) — Client Components (`'use client'`) only for interactivity
- `next/image` for ALL images
- Lazy loading for components > 50KB
- Code splitting with `dynamic()` imports
- Memoization **only when justified** (lists, heavy computations)

```typescript
// Lazy loading heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Justified memoization
const filtered = useMemo(() =>
  items.filter(i => i.status === 'active'),
  [items]
)
```

If unsure:
> **Choose the simpler and more predictable solution**
<!-- forge:end:performance -->

---

<!-- forge:start:architecture -->
## 🧱 Architecture & Structure

| Location | Responsibility |
|----------|---------------|
| Components | UI, rendering, minimal logic |
| Hooks | State logic and side effects |
| Services | External communication (APIs) |
| Utils | Pure functions, no side effects |
| Types | Type definitions |

**Never mix responsibilities in the same file.**

### Reusable code locations
```
/lib/utils.ts        → General utility functions
/lib/format.ts       → Formatting (currency, date, number)
/hooks/use-*.ts      → Custom hooks
/components/ui/*     → Primitive UI components
/types/*.ts          → Types and interfaces
```

**Before creating any utility function, check if it already exists in the centralized locations above.**
<!-- forge:end:architecture -->

---

<!-- forge:start:state-management -->
## 🧠 State Management

- Avoid global state unless necessary
- Prefer local state first
- Lift state **only when there is a real need**
- Keep state minimal and normalized

Rule of thumb:
> If it's not shared, it shouldn't be global
<!-- forge:end:state-management -->

---

<!-- forge:start:components-functions -->
## 🧩 Components & Functions

### React Component Structure (~100-300 lines ideal)
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component
export function MetricCard({ title, value }: MetricCardProps) {
  // 3a. Hooks
  // 3b. Computed values (useMemo)
  // 3c. Handlers (useCallback if passed as prop)
  // 3d. Effects
  // 3e. Early returns (loading, error)
  // 3f. Render
  return (/* ... */)
}
```

### CSS/Tailwind
```typescript
// Use cn() for conditional classes
className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // props.className last
)}
```

### Functions
- Do one thing, be readable without comments
- Extract hooks for logic > 50 lines
- If copy/paste > 3 lines → create function/component
<!-- forge:end:components-functions -->

---

<!-- forge:start:naming-conventions -->
## 📝 Naming Conventions

### Files
```
components/product-card.tsx      # kebab-case
hooks/use-cart.ts                # use- prefix
lib/format-price.ts              # kebab-case
types/product.ts                 # singular
```

### Variables & Functions
```typescript
const productList = []            // camelCase
function calculateROAS() {}       // camelCase, descriptive

function MetricCard() {}          // PascalCase for components
interface CampaignData {}         // PascalCase for types

const MAX_RETRIES = 3             // UPPER_SNAKE_CASE for constants
```

### Booleans must read like a sentence
`isLoading`, `hasPermission`, `shouldRenderHeader`, `canEdit`

### Descriptive names (MANDATORY)
❌ `handleData()`, `processItems()`, `doStuff()`
✅ `calculateOrderTotal()`, `filterActiveCampaigns()`, `formatCurrencyBRL()`
<!-- forge:end:naming-conventions -->

---

<!-- forge:start:bug-prevention -->
## 🛡️ Bug Prevention Rules

### Validate at system boundaries
- ALWAYS validate user input (forms, URL params, API bodies)
- NEVER trust external API responses — check for null/undefined
- Use Zod or similar for runtime validation at boundaries
- Parse, don't validate: transform unknown data into typed objects

```typescript
// ❌ Trust external data
const user = await api.getUser(id) // might be null
return user.name // 💥 runtime error

// ✅ Validate at boundary
const user = await api.getUser(id)
if (!user) throw new NotFoundError('User not found')
return user.name
```

### Prevent common bugs
- Always handle loading, error, and empty states in UI
- Never use `!` (non-null assertion) — use proper null checks
- Use optional chaining (`?.`) for potentially undefined chains
- Default to empty arrays/objects instead of null/undefined
- Provide fallback values for optional props

### Error handling at every level
- API calls: wrap in try/catch, show user-friendly error
- Async operations: always handle rejected promises
- State updates: validate before setting state
- Never silently swallow errors — at minimum, log them

### Type safety
- Zero `any` tolerance — use `unknown` if type is truly unknown
- Prefer discriminated unions over boolean flags
- Use `as const` for literal types
- Exhaustive switch/case with `never` default
<!-- forge:end:bug-prevention -->

---

<!-- forge:start:testing -->
## 🧪 Testing Rules

### What MUST be tested
- **UI primitive components** (Button, Input, Select, Modal, etc.) — each must have its own test file
- **Custom hooks** with business logic
- **Utility functions** (formatters, validators, parsers)
- **API service functions** (mock the HTTP layer)

### Test file convention
```
components/button.tsx        → components/button.test.tsx
components/input.tsx         → components/input.test.tsx
hooks/use-cart.ts            → hooks/use-cart.test.ts
lib/format-price.ts          → lib/format-price.test.ts
```

### What to test in UI components
```typescript
// button.test.tsx
describe('Button', () => {
  it('renders with correct text', () => {})
  it('calls onClick when clicked', () => {})
  it('is disabled when disabled prop is true', () => {})
  it('applies variant classes correctly', () => {})
  it('renders loading state', () => {})
})
```

### Testing principles
- Test **behavior**, not implementation details
- One assertion per test (when possible)
- Use descriptive test names: `it('shows error message when email is invalid')`
- Mock external dependencies (APIs, storage), never mock internal modules
- Prefer `userEvent` over `fireEvent` for user interactions
- Always test: happy path, error states, edge cases, loading states

### When NOT to test
- Pure layout/wrapper components with no logic
- Third-party library internals
- Implementation details (internal state, private methods)
<!-- forge:end:testing -->

---

<!-- forge:start:error-handling -->
## 🧪 Error Handling

- Handle errors explicitly
- Never silently fail
- Prefer early returns
- Fail fast when something is wrong

If an error is expected:
> Make it explicit in the code
<!-- forge:end:error-handling -->

---

<!-- forge:start:code-style -->
## 🧼 Code Style & Clean Code

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

```typescript
// ❌ Dirty code
import { useState, useEffect, useCallback } from 'react' // useCallback unused
const unused = 'test'
// const oldCode = 'removed'
console.log('debug')

// ✅ Clean code
import { useState, useEffect } from 'react'
```

### DRY — No duplication (MANDATORY)

- Copy/paste > 3 lines → create function/component
- Repeated logic in 2+ places → extract to hook/util
- Similar types → use generics or extends
- **NEVER create local utility functions** when a centralized version exists
<!-- forge:end:code-style -->

---

<!-- forge:start:accessibility -->
## ♿ Accessibility (a11y)

- Always consider accessibility
- Semantic HTML when possible
- Keyboard navigation matters
- Text contrast is not optional
<!-- forge:end:accessibility -->

---

<!-- forge:start:implementation-protocol -->
## 🔄 Implementation Protocol

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
- Verify no `any` types, no unused code, no console.logs
- Confirm the change actually solves the original problem

### Completion Criteria (MANDATORY)
A task is ONLY considered complete when ALL of the following are true:
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No ESLint errors
- [ ] No unused imports, variables, or dead code
- [ ] All affected test files pass
- [ ] Visual output matches expected behavior (if UI change)

**NEVER declare a task complete if any check fails.**
If a check fails, fix the issue and verify again.
<!-- forge:end:implementation-protocol -->

---

<!-- forge:start:ai-interaction -->
## 🧠 AI Interaction Rules

When generating or modifying code, the AI must:

1. Respect **all rules in this file**
2. Never exceed **400 lines per file**
3. Prefer **incremental changes** — one concern per edit
4. Explain architectural decisions briefly
5. Ask before introducing new libraries or patterns
6. **Never refactor unrelated code**
7. Check existing utils before creating any new utility function

### Task Completion Protocol (MANDATORY)

A task is **NOT complete** until the AI has verified:
1. **Types** — `npx tsc --noEmit` passes with zero errors
2. **Build** — `npm run build` succeeds
3. **Lint** — No ESLint errors in modified files
4. **Clean** — No unused imports, variables, dead code, console.logs
5. **Review** — Re-read every changed file top to bottom
6. **Test** — Affected tests still pass (if applicable)

**If any check fails → fix it before declaring the task complete.**
Never say "done" with known broken code.

### Checklist before committing
- [ ] File < 400 lines
- [ ] CSS is responsive (mobile-first or desktop-first as specified)
- [ ] No duplicated code (especially formatting → use centralized utils)
- [ ] Heavy components are lazy loaded
- [ ] No `any` in types
- [ ] Hooks extracted for logic > 50 lines
- [ ] Images use `next/image` (web projects)
- [ ] Clean code: no unused imports/variables/functions
- [ ] No console.logs
- [ ] No commented-out code (dead code)
- [ ] Descriptive and explicit names
- [ ] Error states handled (loading, error, empty)
<!-- forge:end:ai-interaction -->

---

<!-- forge:start:avoid-list -->
## 🚫 Explicitly Avoid

- Over-engineering and unnecessary abstractions
- Large refactors without request
- "God files" with multiple responsibilities
- Duplicated local utility functions
- `any` in TypeScript
- Console.logs and commented-out code
- Hover-only interactions
- Magic numbers without named constants
- Framework hype solutions
- Clever hacks that reduce readability

---

## ✅ Final Goal

The codebase must be:

- Easy to understand in 6 months
- Easy to delete and refactor
- Friendly for humans first, AI second
- Performant on low-end mobile devices

> **If in doubt, choose the simplest solution that works.**
<!-- forge:end:avoid-list -->

---

<!-- forge:start:responsive-design -->
## 📱 Responsive Design Rules — Mobile First (MANDATORY)

- ALWAYS start CSS/Tailwind from mobile
- Use `min-width` media queries, NEVER `max-width` as base
- Test on mobile BEFORE desktop
- Breakpoint order: base → `sm:` → `md:` → `lg:` → `xl:`

```typescript
// ✅ CORRECT — Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<div className="p-4 md:p-6 lg:p-8">
<div className="text-sm md:text-base lg:text-lg">

// ❌ WRONG — Desktop-first
<div className="grid grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
```

### Shared Rules
- Always use responsive layouts (`sm:`, `md:`, `lg:` breakpoints)
- Never use hover-only interactions (always have a tap/click fallback)
- Touch targets minimum 44px
- Test on both mobile and desktop viewports
<!-- forge:end:responsive-design -->
