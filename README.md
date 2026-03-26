# opencode_customizations

Custom agents and tools for [OpenCode](https://opencode.ai). The agent templates are based on the workflow described by Stavros Korokithakis at https://www.stavros.io/posts/how-i-write-software-with-llms/. The `junior-developer` agent was added separately.

## Installation

Copy the contents of `.config/opencode/` into your local OpenCode config directory:

- **Linux/macOS/Windows:** `~/.config/opencode/`

Agents go in the `agent/` subdirectory; tools go in the `tools/` subdirectory. OpenCode picks them up automatically on next launch.

## Agents

All agents except `architect` run as subagents — they are invoked by other agents, not directly by the user.

### `architect`

**Mode:** primary | **Model:** claude-opus-4.6

The entry point for all implementation work. Collaborates with the user to define requirements, then drives execution through the rest of the pipeline. Never writes source code itself — its only output is Task Brief files written to `thoughts/<topic>/NNN-<task-title>.md`. Delegates complex tasks to `@developer` and trivial tasks to `@junior-developer`. Returns to the user once reviewers have approved.

### `developer`

**Mode:** subagent | **Model:** claude-sonnet-4.6

Implements tasks as defined in a Task Brief file. Follows existing repository conventions, applies YAGNI, and validates work via `@test-runner` before requesting parallel review from both code reviewers. Iterates until both reviewers approve, then reports to `@architect`.

### `junior-developer`

**Mode:** subagent | **Model:** claude-haiku-4.5

Handles straightforward, well-scoped tasks assigned by `@architect`. Operates with a narrower mandate than `@developer`: follows existing patterns closely, escalates ambiguity early, and raises architectural concerns to `@architect` rather than resolving them independently. Uses the same review and validation loop as `@developer`.

### `code-reviewer`

**Mode:** subagent | **Model:** gpt-5.3-codex

Reviews the `git diff` for a completed task against its Task Brief. Outputs only actionable change requests covering correctness, security, simplicity, and test coverage. Approves to `@developer` and sends observations to `@architect`. Uses a GPT-based model to provide a perspective independent of the Claude-based implementers.

### `code-reviewerer`

**Mode:** subagent | **Model:** claude-opus-4.6

Identical review mandate to `@code-reviewer`, using a Claude-based model. Both reviewers must approve before a task is considered complete. The dual-reviewer setup with different model families provides independent signal on every change.

### `git-guy`

**Mode:** subagent | **Model:** claude-sonnet-4.6

Handles all git housekeeping at the end of an implementation cycle. Inspects pending working-tree changes, groups them into logical commits when changes span independent concerns, pushes to the remote, and opens a pull request. Discovers and populates any existing PR template (`.github/PULL_REQUEST_TEMPLATE.md` and variants); falls back to a composed description when none is found. Uses the GitHub CLI (`gh`) when available, otherwise prints a ready-to-open URL with the composed title and body for manual submission. Does not modify source files or force-push.

### `test-runner`

**Mode:** subagent | **Model:** claude-sonnet-4.6

Discovers and executes all quality checks configured in the repository — pre-commit hooks, linters, type checkers, and test suites. Determines the right commands from config files (`.pre-commit-config.yaml`, `Makefile`, `pyproject.toml`, `package.json`, etc.) without guessing, preferring a single aggregator command when one exists. Reports a structured pass/fail result for each check and an overall verdict. Called by `@developer` and `@junior-developer` before they report completion, and optionally by `@code-reviewer` and `@code-reviewerer` to verify validation claims. Does not modify source files or install dependencies.

### `repo-scout`

**Mode:** subagent | **Model:** claude-sonnet-4.6

Scans an unfamiliar repository and produces a structured report covering stack, conventions, linting/testing commands, project structure, and do/don't patterns. Writes and maintains `ARCHITECTURE.md` at the repo root. Does not modify any other files, install dependencies, or access the network.

## Tools

### `uuidv7.ts`

Generates one or more [UUIDv7](https://www.ietf.org/rfc/rfc9562.html) identifiers. UUIDv7 encodes a millisecond-precision Unix timestamp in the most-significant bits, making the output monotonically ordered and suitable for use as a database primary key.

**Parameter:** `count` (integer, 1–100, default 1)

Implemented in TypeScript using the `@opencode-ai/plugin` tool API. No external dependencies — uses the Web Crypto API only.
