# claude-forge

CLI for managing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configurations across projects. Generate `CLAUDE.md`, hooks, MCP servers, and skills — with AI assistance.

## Why

Claude Code works best with good context. But setting up `CLAUDE.md`, hooks, permissions, and MCP configs manually for every project is repetitive. And when you get your setup right, there's no easy way to reuse it.

**claude-forge** solves this:

1. **Generate** — Detects your stack and creates a tailored `CLAUDE.md` with best practices, hooks, and permissions
2. **Enhance** — Uses the Anthropic API to generate hooks, MCPs, and skills from natural language descriptions
3. **Sync** — Stores all your configs in a **private GitHub repo** so you can push, pull, and share across every project and machine

## How It Works

```
┌─────────────────────────────────────────────────────┐
│              Your GitHub Config Repo                 │
│              (private, auto-created)                 │
│                                                      │
│  projects/                                           │
│  ├── my-saas-app/                                    │
│  │   ├── CLAUDE.md                                   │
│  │   ├── .claude/settings.json                       │
│  │   ├── .claude/hooks/pre-commit-lint.sh            │
│  │   └── manifest.json                               │
│  ├── my-api/                                         │
│  │   ├── CLAUDE.md                                   │
│  │   ├── .claude/settings.json                       │
│  │   └── manifest.json                               │
│  └── my-mobile-app/                                  │
│      └── ...                                         │
└──────────────┬──────────────────┬────────────────────┘
               │                  │
          claude-forge        claude-forge
              push                pull
               │                  │
      ┌────────▼───┐      ┌──────▼──────┐
      │ Project A  │      │  Project B  │
      │ (laptop)   │      │ (desktop)   │
      └────────────┘      └─────────────┘
```

When you run `claude-forge login`, it creates (or connects to) a **private GitHub repository** that becomes your central config hub. Every project you initialize gets its own folder inside that repo. Use `push` to save and `pull` to restore — across projects, machines, or teammates.

## Install

```bash
npm install -g claude-forge
```

Requires Node.js >= 20 and [GitHub CLI](https://cli.github.com/) (`gh`).

## Quick Start

```bash
# 1. Connect your config repo (one-time setup)
claude-forge login
# → Creates a private repo like github.com/you/my-claude-configs

# 2. Initialize any project
cd your-project
claude-forge init
# → Detects stack, generates CLAUDE.md, hooks, permissions

# 3. Save your configs
claude-forge push
# → Syncs everything to your config repo

# 4. Restore on another machine or project
claude-forge pull
# → Pulls configs from your repo
```

## Commands

### `claude-forge login`

Connect to your config repo. This is the first thing you should run.

```bash
claude-forge login
```

What happens:
- Authenticates with GitHub via `gh` CLI
- Asks for a repo name (default: `my-claude-configs`)
- Creates a **private repo** on your GitHub if it doesn't exist
- Clones it locally for syncing

You only need to do this once per machine.

### `claude-forge init`

Initialize Claude Code configuration for the current project.

```bash
claude-forge init
```

The interactive setup will:
1. Ask for your Anthropic API key (for AI-assisted features)
2. Auto-detect your framework (Next.js, React, Fastify, Flutter, etc.)
3. Let you pick sections, hooks, and quality settings
4. Generate all config files

Generates:
- `CLAUDE.md` — AI guidelines tailored to your stack
- `.claude/settings.json` — hooks and permissions
- `.claude/hooks/*.sh` — hook scripts (lint, typecheck, etc.)

### `claude-forge push`

Push your project's configs to the sync repo.

```bash
claude-forge push
claude-forge push -m "added new hooks"
```

Saves `CLAUDE.md`, `.claude/settings.json`, hooks, and the project manifest to your config repo under `projects/{project-name}/`.

### `claude-forge pull`

Pull configs from the sync repo into the current project.

```bash
claude-forge pull
claude-forge pull --force    # overwrite without confirmation
```

If local files differ from the synced version, you'll be asked to confirm before overwriting.

### `claude-forge diff`

Compare local configs with the synced version.

```bash
claude-forge diff
```

Shows a colored diff (like `git diff`) for each managed file.

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

### `claude-forge doctor`

Validate your environment, API keys, and project configuration.

```bash
claude-forge doctor
```

Checks: `gh` CLI, GitHub auth, API keys, sync repo, project files.

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
# === Machine A ===

# One-time setup
npm install -g claude-forge
claude-forge login
# → Repo created: github.com/you/my-claude-configs

# Project 1: Next.js app
cd ~/projects/my-saas
claude-forge init          # detects Next.js, generates configs
claude-forge add hook -d "check bundle size before commit"
claude-forge add skill -d "generate API route with validation"
claude-forge push          # saved to config repo

# Project 2: Fastify API
cd ~/projects/my-api
claude-forge init          # detects Fastify, different preset
claude-forge push

# === Machine B (new laptop, same projects) ===

npm install -g claude-forge
claude-forge login         # connects to same repo

cd ~/projects/my-saas
claude-forge init          # same preset
claude-forge pull          # restores all configs, hooks, skills

cd ~/projects/my-api
claude-forge init
claude-forge pull          # done — same setup as Machine A
```

## License

MIT
