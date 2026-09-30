## Codebase exploration delegation

For non-trivial tasks involving an unfamiliar codebase, consider delegating
read-only exploration before planning or implementation.

- Use `scout` for fast, narrow reconnaissance: locating entry points, relevant
  files, existing patterns, tests, and configuration.
- Use `explore` for deeper investigation: tracing callers, dependencies, data
  flow, architecture, and likely change locations.
- Prefer one agent when sufficient. Use both only for distinct exploration
  scopes or when the task is broad enough to benefit from parallel investigation.
- Give each child a concrete question and request evidence with file paths and
  useful line ranges.
- Keep exploration read-only and use fresh context.
- Synthesize the findings in the parent before planning or editing.
- Skip delegation for trivial, obvious, or narrowly scoped tasks where it would
  add overhead without improving confidence.
