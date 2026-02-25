// ─── HOOK GENERATION ───

export function buildHookSystemPrompt(): string {
  return `You are an expert at writing Claude Code hooks — bash scripts that run as pre/post tool-use event handlers.

Claude Code hooks receive JSON on stdin with this structure:
- PostToolUse: { "tool_name": string, "tool_input": object, "tool_result": object }
- PreToolUse: { "tool_name": string, "tool_input": object }

Rules for hook scripts:
1. Start with #!/bin/bash
2. Read stdin: INPUT=$(cat) and parse with jq
3. Extract file path: FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
4. Exit 0 = success/skip, exit 2 = block action (message on stderr)
5. Include early-exit guards (skip irrelevant files by extension, path, etc.)
6. Find project root by walking up directories looking for package.json
7. One check per hook — keep scripts focused
8. Use stderr for errors, stdout for info

Common matchers:
- "Edit|Write" — runs after file edits
- "Bash" — runs after shell commands
- "Read" — runs after file reads

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "id": "kebab-case-id",
  "name": "Human Readable Name",
  "description": "One-line description",
  "event": "PostToolUse" or "PreToolUse",
  "matcher": "Edit|Write",
  "timeout": 30,
  "statusMessage": "Checking...",
  "script": "#!/bin/bash\\n..."
}`
}

export function buildHookUserPrompt(description: string): string {
  return `Create a Claude Code hook for this requirement:

"${description}"

Generate a complete, production-ready bash script following the system prompt patterns. Return ONLY the JSON object.`
}

// ─── MCP GENERATION ───

export function buildMcpSystemPrompt(): string {
  return `You are an expert at configuring MCP (Model Context Protocol) servers for Claude Code.

MCP servers extend Claude Code's capabilities. They run as background processes configured in .claude/settings.json under "mcpServers".

Common patterns:
- npm packages: command="npx", args=["-y", "package-name"]
- Scoped packages: command="npx", args=["-y", "@scope/package-name"]
- Local scripts: command="node", args=["./path/to/server.js"]

Well-known MCP servers:
- @anthropic/github-mcp-server (GitHub)
- vercel-mcp-server (Vercel)
- supabase-mcp-server (Supabase)
- @anthropic/railway-mcp-server (Railway)
- @modelcontextprotocol/server-filesystem (Filesystem)
- @modelcontextprotocol/server-postgres (PostgreSQL)
- @modelcontextprotocol/server-slack (Slack)
- @modelcontextprotocol/server-brave-search (Brave Search)
- @stripe/mcp (Stripe)

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "name": "kebab-case-name",
  "displayName": "Human Readable Name",
  "description": "What this MCP server provides",
  "serverCommand": "npx",
  "args": ["-y", "package-name"],
  "requiresAuth": true,
  "authType": "token",
  "authEnvVar": "ENV_VAR_NAME",
  "setupUrl": "https://..."
}

If no auth is needed, set requiresAuth=false, authType="token", authEnvVar=null, setupUrl=null.`
}

export function buildMcpUserPrompt(description: string): string {
  return `The user wants to add an MCP server integration:

"${description}"

Suggest the most appropriate MCP server and its configuration. Return ONLY the JSON object.`
}

// ─── SKILL GENERATION ───

export function buildSkillSystemPrompt(): string {
  return `You are an expert at writing Claude Code skills (custom slash commands).

Skills are markdown files in .claude/commands/ that become slash commands in Claude Code.
The filename (without .md) becomes the command name: .claude/commands/review.md → /review

Skill files can include:
- Clear instructions for what Claude should do
- $ARGUMENTS placeholder for user input after the command
- Step-by-step workflows
- Examples of expected output
- Constraints and rules

Example skill (.claude/commands/gen-component.md):
"""
Generate a React component based on: $ARGUMENTS

## Rules
- Use TypeScript with explicit return types
- Include a test file using the project's test framework
- Follow existing project patterns and conventions
- Export as a named export

## Steps
1. Analyze the project structure to find the right directory
2. Create the component file
3. Create a test file
4. Update barrel exports if they exist
"""

Respond with ONLY a JSON object (no markdown fences, no extra text):
{
  "name": "kebab-case-command-name",
  "displayName": "Human Readable Name",
  "description": "What this skill does",
  "content": "Full markdown content of the skill file"
}`
}

export function buildSkillUserPrompt(description: string): string {
  return `Create a Claude Code skill (slash command) for this requirement:

"${description}"

Generate comprehensive but focused markdown content. Use $ARGUMENTS where user input is needed. Return ONLY the JSON object.`
}
