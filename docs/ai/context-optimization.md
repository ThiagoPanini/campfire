# Campfire Context Optimization

This repository uses a small context stack:

- RTK reduces noisy terminal output.
- Serena MCP provides symbolic code navigation and editing.
- Agent instruction files keep durable guidance short and discoverable.

## Daily Rules

- Start with the relevant Spec-Kit artifact when it exists.
- Use Serena for source-code structure, references, and symbol edits.
- Use `rg` or `rg --files` for targeted text/file discovery.
- Avoid packing the whole repository unless doing a one-off audit.
- Keep generated caches, logs, secrets, and build outputs out of context and out of Git.

## When Campfire Grows

- Add Terraform to `.serena/project.yml` when real `.tf` source lands.
- Consider Codebase Context after there is enough Git history to identify stable patterns.
- Add AWS or Terraform MCP servers only when infrastructure work becomes frequent.
