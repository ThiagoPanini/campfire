# Campfire Copilot Instructions

Campfire is a solo-built, AI-assisted music hub for amateur jam sessions.

- Prefer narrow context: use Serena MCP or focused search before reading large file sets.
- Follow `AGENTS.md` for shared project rules.
- Respect Spec-Kit artifacts when they exist.
- Keep generated code aligned with existing local examples.
- For terminal work, prefer `rtk <command>` when a shell command is needed.
- Do not introduce broad tooling, architecture, or framework changes unless the task requires them.

## RTK Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl get pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```
