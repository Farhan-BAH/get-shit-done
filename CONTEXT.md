# Context

## Domain terms

### Dispatch Policy Module
Module owning dispatch error mapping, fallback policy, timeout classification, and CLI exit mapping contract.

Canonical error kind set:
- `unknown_command`
- `native_failure`
- `native_timeout`
- `fallback_failure`
- `validation_error`
- `internal_error`

### Command Definition Module
Canonical command metadata Interface powering alias, catalog, and semantics generation.

### Query Runtime Context Module
Module owning query-time context resolution for `projectDir` and `ws`, including precedence and validation policy used by query adapters.

### Native Dispatch Adapter Module
Adapter Module that satisfies native query dispatch at the Dispatch Policy seam, so policy modules consume a focused dispatch Interface instead of closure-wired call sites.

### Query CLI Output Module
Module owning projection from dispatch results/errors to CLI `{ exitCode, stdoutChunks, stderrLines }` output contract.

### Query Execution Policy Module
Module owning query transport routing policy projection (`preferNative`, fallback policy, workstream subprocess forcing) at execution seam.

### Query Subprocess Adapter Module
Adapter Module owning subprocess execution contract for query commands (JSON/raw invocation, `@file:` indirection parsing, timeout/exit error projection).

### Query Command Resolution Module
Canonical command normalization and resolution Interface (`query-command-resolution-strategy`) used by internal query/transport paths after dead-wrapper convergence.

### Command Topology Module
Module owning command resolution, policy projection (`mutation`, `output_mode`), unknown-command diagnosis, and handler Adapter binding at one seam for query dispatch.

### Query Pre-Project Config Policy Module
Module policy that defines query-time behavior when `.planning/config.json` is absent: use built-in defaults for parity-sensitive query Interfaces, and emit parity-aligned empty model ids for pre-project model resolution surfaces.

---

## Recurring PR mistakes (distilled from CodeRabbit reviews, 2026-05-05)

### Tests — no source-grep
- **Rule**: never bind `readFileSync` result to a var then call `.includes()` / `.match()` / `.startsWith()` on it. CI runs `scripts/lint-no-source-grep.cjs` and exits 1.
- **Escape**: add `// allow-test-rule: <reason>` anywhere in the file to exempt the whole file. Use when reading product markdown or runtime output (not `.cjs` source).
- **Pattern to reach for instead**: call the exported function, capture stdout/JSON, assert on typed fields.

### Tests — no unescaped RegExp interpolation
- `new RegExp(\`prefix${someVar}\`)` — if `someVar` can contain `.` or other metacharacters (e.g. phase id `5.1`), the pattern is wrong. Always `escapeRegex(someVar)`. The `escapeRegex` utility is in `core.cjs` and already imported in most modules.

### Tests — no dead regex branches in `.includes()`
- `src.includes('foo.*bar')` is always false — `.*` is a regex metacharacter, not a wildcard in `includes`. Either use `new RegExp('foo.*bar').test(src)` or delete the branch.

### Tests — guard top-level `readFileSync` against ENOENT
- Module-level `const src = fs.readFileSync(...)` throws before any `test()` registers, aborting the runner with an unhandled exception instead of a named failure. Wrap in try/catch and rethrow with a helpful message.

### Changesets — `pr:` field must be the PR number, not the issue number
- The `pr:` key in `.changeset/*.md` frontmatter must reference the PR introducing the fix (e.g. `3142`), not the issue it closes (e.g. `3120`). Changelog tooling links to GitHub PRs by this value.

### Shell hooks — never interpolate `$VAR` into single-quoted JS strings
- `node -e "require('$HOOK_DIR/lib/foo.js')"` breaks silently if `$HOOK_DIR` contains a single quote (POSIX-legal). Pass paths via env vars: `GIT_CMD_LIB="$HOOK_DIR/lib/foo.js" node -e "require(process.env.GIT_CMD_LIB)"`.

### Shell guards — `[ -f .git ]` does not detect worktrees from main repo
- In the main repo `.git` is a directory, so `[ -f .git ]` is false and the entire guard is skipped. Use `git rev-parse --git-dir` and match `*.git/worktrees/*` in a `case` statement instead.

### Shell guards — absolute-path containment must use `root/` prefix, not glob
- `[[ "$PATH" != "$ROOT"* ]]` matches sibling prefixes (`/repo-extra` passes when `ROOT=/repo`). Use `[[ "$P" != "$ROOT" && "$P" != "$ROOT/"* ]]`. Also: check `[ -z "$ROOT" ]` and exit 1 before the containment test. Warn → fail-closed for security-relevant path checks.

### Docs — keep internal reference counts consistent
- When a heading says `(N shipped)` and a footnote says `N-1 top-level references`, update the footnote. CodeRabbit catches this every time.
