---
name: azure-cost-health-check
description: Open Azure Cost Health Check for read-only cost, forecast, budget, governance, and AI billing analysis.
---

Use the host-declared `azure-cost-health-check` canvas. Inspect its capabilities
and open it with a fresh instance handle and `input: { "mode": "real" }`.
If multiple providers register that canvas ID, ask the user to select the
host-declared provider rather than guessing an extensionId. Do not reuse a panel
owned by another canvas or provider.

This import contains no mock dataset. Do not select mock mode or promise an
automatic demo fallback. Azure CLI must be installed and signed in outside the
canvas; read failures are not evidence of zero spend. Show the actual error.
Native-alert and analysis handoffs ask the chat agent for guidance; they do not
authorize Azure writes.
