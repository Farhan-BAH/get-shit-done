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

---

## Workflow learnings (distilled from triage + PR cycle, 2026-05-05)

### Skill consolidation gap class — missing workflow files
- When a command absorbs a micro-skill as a flag (e.g. `capture --backlog`), the old command's process steps must be ported to a `get-shit-done/workflows/<name>.md` file. The routing wrapper in `commands/gsd/*.md` declares an `execution_context` `@`-reference to that workflow — if the file doesn't exist the agent loads nothing and has no steps to follow.
- **Detection**: `tests/bug-3135-capture-backlog-workflow.test.cjs` adds a broad regression — every `execution_context` `@`-reference in any `commands/gsd/*.md` must resolve to an existing file on disk. This test will catch all future gaps of this class immediately.
- **Prior art**: `reapply-patches.md` was the first gap found and fixed in PR #2824 itself. `add-backlog.md` was missed in the same PR and caught later in #3135. Run the regression test after every consolidation PR.

### CodeRabbit thread resolution — stale threads after allow-test-rule fixes
- After adding `// allow-test-rule:` to silence lint, CodeRabbit's existing inline threads remain open even though the acknowledged fix is in place. Resolve them via `resolveReviewThread` GraphQL mutation before merging — open threads block clean merge history and mislead future reviewers.
- Pattern: `gh api graphql -f query='mutation { resolveReviewThread(input:{threadId:"PRRT_..."}) { thread { isResolved } } }'`

### PR discipline — split unrelated changes into separate PRs
- A bug fix and a docs rewrite committed to the same branch produce a noisy diff and a PR that reviewers can't cleanly approve. Cherry-pick doc changes to a dedicated branch (`docs/`) immediately, then force-push the original branch to remove the commit. One concern per PR.

### INVENTORY.md must be updated alongside every workflow file addition/removal
- `docs/INVENTORY.md` tracks the shipped workflow count (`## Workflows (N shipped)`) and has one row per file. Adding or removing a workflow without updating INVENTORY produces an internally inconsistent doc.
- Also update `docs/INVENTORY-MANIFEST.json` — it is the machine-readable manifest and must stay in sync with the filesystem.
- When a flag absorbs a micro-skill, the old skill's `Invoked by` attribution in INVENTORY must move to the new parent (e.g. `add-todo.md` incorrectly claimed `/gsd-capture --backlog` until #3135 corrected it).

### README — keep root README as storyline only; all detail lives in docs/
- Root `README.md` should be ≤300 lines: hero, author note, 6-step loop, install, core command table, why-it-works bullets, config key dials, docs index, minimal troubleshooting.
- Every removed detail section needs a link to the canonical doc that covers it. All doc links must resolve before committing.
- Markdownlint rules to watch: MD001 (heading level skip — don't use `###` directly inside admonitions; use bold instead), MD040 (fenced code blocks must declare a language identifier).

### Issue triage — always check for existing work before filing as new
- Before writing an agent brief for a confirmed bug, check: (1) local branches (`git branch -a | grep <issue>`), (2) untracked/modified files on that branch, (3) stash, (4) open PRs with matching head branch. A crash may have left work 90% done — recover and commit rather than re-implementing.

### SDK-only verbs — golden-policy exemption required
- Any `gsd-sdk query` verb implemented only in the SDK native registry (no `gsd-tools.cjs` mirror) must be added to `NO_CJS_SUBPROCESS_REASON` in `sdk/src/golden/golden-policy.ts`. Without this entry the golden-policy test fails, treating the verb as a missing implementation rather than an intentional SDK-only path.
