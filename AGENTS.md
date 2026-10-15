# Canvas Template Repository

## Purpose

This repository is a starter template for building GitHub Copilot Canvas
extensions. Keep the starter small and easy to adapt. When implementing a
Canvas, replace the example behavior with the requested product behavior rather
than adding unrelated features.

## Project Layout

- `.github/extensions/mini-canvas/extension.mjs` is the example extension
  entry point. It registers the Canvas and connects its lifecycle to a local
  renderer.
- `README.md` is the user-facing setup and usage guide. Update it when setup,
  commands, configuration, or the Canvas behavior changes.

Preserve the extension location unless the extension loader configuration is
also updated. Keep an entry point focused on wiring; split substantial action,
rendering, or shared logic into nearby modules when that makes the code easier
to understand.

## Canvas Extension Guidelines

- Use the existing `@github/copilot-sdk/extension` APIs and repository
  conventions. Check the installed SDK types or documentation before relying on
  additional APIs.
- Give every Canvas a stable, unique `id`. Keep its `displayName`,
  `description`, opened title, and README description consistent.
- Keep instance-specific resources keyed by `ctx.instanceId`. The example
  supports multiple open instances; do not accidentally share or overwrite
  their servers or state.
- Make `open` return a usable title and renderer URL. If opening allocates
  resources, make `onClose` release them and remove their instance state.
- Bind local development servers to loopback, use an ephemeral port when
  appropriate, and avoid assumptions that a port is available in advance.
- Surface startup and rendering errors instead of silently returning a
  success-shaped fallback.
- Do not add secrets, credentials, or machine-specific configuration to the
  repository. Validate and safely handle data crossing the extension/server/
  renderer boundary.
- Avoid introducing a framework, dependency, build system, or configuration
  unless the requested Canvas needs it. Follow the chosen tool's established
  conventions once introduced.

## Implementation Workflow

1. Inspect the extension entry point, README, and available project scripts
   before changing the architecture.
2. Implement the smallest complete Canvas behavior that satisfies the request.
   Keep lifecycle cleanup and multiple-instance behavior in scope when touching
   server or state management.
3. Update the README and any directly affected documentation so a new user can
   run and understand the Canvas.
4. Run the relevant checks available in the repository. If there is no test or
   build setup, at minimum run `node --check` on changed JavaScript modules and
   describe any validation that could not be performed.
5. Review the final diff for accidental generated files, secrets, and
   unrelated changes.

Do not claim that a build, test, or runtime check passed unless it was actually
run.
