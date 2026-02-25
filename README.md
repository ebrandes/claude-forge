# claude-forge

CLI for managing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configurations across projects. Generate `CLAUDE.md`, hooks, MCP servers, and skills — with AI assistance.

## Why

Claude Code works best with good context. But setting up `CLAUDE.md`, hooks, permissions, and MCP configs manually for every project is repetitive. And when you get your setup right, there's no easy way to reuse it.

**claude-forge** solves this:

1. **Generate** — Detects your stack and creates a tailored `CLAUDE.md` with best practices, hooks, and permissions
2. **Enhance** — Uses the Anthropic API to generate hooks, MCPs, and skills from natural language descriptions
3. **Sync** — Stores your configs in a **private GitHub repo** organized by preset, so every project with the same stack shares the same rules

## How It Works

```
┌──────────────────────────────────────────────────┐
│         Your GitHub Config Repo                   │
│         (private, auto-created)                   │
│                                                    │
│  CLAUDE.md                                         │
│  .claude/settings.json                             │
│  .claude/hooks/check-ts.sh                         │
│  .claude/commands/gen-component.md                 │
│  manifest.json                                     │
└───────────┬──────────┬──────────┬─────────────────┘
            │          │          │
           push       pull       pull
            │          │          │
   ┌────────▼───┐ ┌────▼────┐ ┌──▼──────────┐
   │  my-saas   │ │ my-shop │ │  my-api     │
   └────────────┘ └─────────┘ └─────────────┘
```

One set of configs, shared across **all** your projects. Push from any project, pull into any other. Your `CLAUDE.md`, hooks, and skills live in a single private repo.

## Install

```bash
npm install -g claude-forge
```

Requires Node.js >= 20 and [GitHub CLI](https://cli.github.com/) (`gh`).

## Quick Start

```bash
# 1. Initialize a project (auto-creates config repo on first run)
cd your-project
claude-forge init
# → Sets up config repo, detects stack, generates CLAUDE.md, hooks, permissions

# 2. Save your configs to the central repo
claude-forge push
# → Pushes to github.com/you/my-claude-configs

# 3. Reuse in any other project
cd another-project
claude-forge init
claude-forge pull
# → Same CLAUDE.md, same hooks, same skills. Zero manual setup.
```

## Commands

### `claude-forge init`

Initialize Claude Code configuration for the current project.

```bash
claude-forge init
```

On first run, it automatically sets up your config repo (same as `claude-forge login`). Then:

1. Asks for your Anthropic API key (for AI-assisted features)
2. Auto-detects your framework (Next.js, React, Fastify, Flutter, etc.)
3. Lets you pick sections, hooks, and quality settings
4. Generates all config files

Generates:
- `CLAUDE.md` — AI guidelines tailored to your stack
- `.claude/settings.json` — hooks and permissions
- `.claude/hooks/*.sh` — hook scripts (lint, typecheck, etc.)

### `claude-forge push`

Push configs to your central config repo.

```bash
claude-forge push
claude-forge push -m "added testing rules"
```

```
claude-forge push
→ Config repo: you/my-claude-configs
→ Syncing configs
✓ Synced CLAUDE.md
✓ Synced .claude/settings.json
✓ Synced .claude/hooks/check-ts.sh
✓ Pushed 3 files to "you/my-claude-configs"
  Run "claude-forge pull" in any project to use these configs.
```

### `claude-forge pull`

Pull configs from the central repo into the current project.

```bash
claude-forge pull
claude-forge pull --force    # overwrite without confirmation
```

If local files differ from the repo version, you'll be asked to confirm before overwriting.

### `claude-forge diff`

Compare local configs with the central repo version.

```bash
claude-forge diff
```

Shows a colored diff for each managed file against what's in the config repo.

### `claude-forge add hook`

Generate a hook with AI assistance.

```bash
claude-forge add hook
claude-forge add hook -d "block commits with TODO comments"
```

Describe what you want in plain text. The AI generates the bash script, you review and accept. The hook is registered in `.claude/settings.json` automatically.

### `claude-forge add mcp`

Configure an MCP server with AI assistance.

```bash
claude-forge add mcp
claude-forge add mcp -d "Stripe payment integration"
```

### `claude-forge add skill`

Create a Claude Code slash command with AI assistance.

```bash
claude-forge add skill
claude-forge add skill -d "generate React component with tests"
```

Creates `.claude/commands/{name}.md` — use it as `/name` inside Claude Code.

### `claude-forge login`

Manually configure the config repo (normally handled by `init` automatically).

```bash
claude-forge login
```

What happens:
- Authenticates with GitHub via `gh` CLI
- Searches for existing config repos (by `claude-forge` topic)
- Creates a **private repo** if none found
- Clones it locally for syncing

### `claude-forge doctor`

Validate your environment, API keys, and project configuration.

```bash
claude-forge doctor
```

### `claude-forge list`

List available presets and sections.

```bash
claude-forge list presets
claude-forge list sections
```

### `claude-forge preset`

Show details of a specific preset.

```bash
claude-forge preset next-app
```

## Presets

| Preset | Stack |
|--------|-------|
| `next-app` | Next.js with App Router |
| `react-spa` | React SPA (Vite) |
| `react-native` | React Native / Expo |
| `fastify-api` | Fastify REST API |
| `flutter-app` | Flutter / Dart |
| `node-lib` | Node.js library |
| `monorepo` | Monorepo (Turborepo, Nx) |

Each preset includes curated sections and hooks optimized for that stack.

## Sections

The generated `CLAUDE.md` is composed of modular sections that you can enable/disable:

| Section | What it covers |
|---------|---------------|
| Core Principles | Performance, simplicity, readability |
| File Size Rules | Max 400 lines, splitting strategies |
| Performance | Re-render prevention, lazy loading, memoization |
| Architecture | Separation of concerns, file organization |
| State Management | Local-first, minimal global state |
| Components & Functions | Structure, CSS/Tailwind, extraction rules |
| Naming Conventions | Files (kebab-case), variables (camelCase), booleans |
| Bug Prevention | Boundary validation, null safety, type safety |
| Testing | What to test, file conventions, testing principles |
| Error Handling | Explicit errors, early returns, fail fast |
| Code Style | Clean code, DRY, no dead code |
| Accessibility | Semantic HTML, keyboard navigation, contrast |
| Responsive Design | Mobile-first or desktop-first by route |
| Implementation Protocol | Step-by-step workflow, completion criteria |
| AI Interaction | Rules for AI-generated code quality |
| Avoid List | Anti-patterns to prevent |

## Generated Files

```
your-project/
├── CLAUDE.md                      # AI guidelines
├── .claude/
│   ├── settings.json              # Hooks + permissions
│   ├── settings.local.json        # Local secrets (gitignored)
│   ├── hooks/
│   │   ├── pre-commit-lint.sh
│   │   ├── pre-commit-tsc.sh
│   │   └── ...
│   └── commands/
│       └── gen-component.md       # AI-generated skills
└── .claude-forge.json             # Project manifest (gitignored)
```

## Full Workflow Example

```bash
# === First time setup ===
npm install -g claude-forge

# === Project 1: set up your configs ===
cd ~/projects/my-saas
claude-forge init                  # sets up config repo + generates configs
claude-forge add hook -d "check bundle size"
claude-forge add skill -d "generate API route with validation"
claude-forge push                  # saves to your config repo

# === Project 2: reuse everywhere ===
cd ~/projects/my-shop
claude-forge init
claude-forge pull                  # pulls configs from your repo
# → Same CLAUDE.md, same hooks, same skills. Zero manual setup.

# === Project 3: same thing ===
cd ~/projects/my-api
claude-forge init
claude-forge pull                  # same configs, different project

# === New machine ===
npm install -g claude-forge
cd ~/projects/my-saas
claude-forge init                  # finds existing config repo automatically
claude-forge pull                  # restores all configs
```

## License

MIT
