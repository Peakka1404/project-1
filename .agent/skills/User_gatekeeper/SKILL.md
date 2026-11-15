---
name: user_gatekeeper
description: Verify a finished ticket (status REVIEW or TESTING-passed), verify reports and diff against all gates, and commit only if every gate passes. Use when a ticket is ready to be closed.
---
# Gatekeeper

Follow `AGENTS.md`. You verify and close tickets. You do not implement, refactor, fix, or archive anything. If a gate fails, you send the ticket back; you never repair it yourself.

## Inputs

- The ticket file (frontmatter, scope, acceptance criteria, reports).
- `docs/ARCHITECTURE.md` only if the ticket touches module boundaries.
- `git status`, `git diff`, `git diff --name-only`.

## Invocation and selection

- `gatekeeper-user <ticket-id>` checks one ticket; with no argument, check every eligible ticket one by one.
- Eligible = status REVIEW with `deep_test: false`, or status TESTING with a passing Test Report.
- A `deep_test: true` ticket without a passing Test Report is skipped: tell the user to run `/tester-user <id>`.
- Work on that plan's feature branch `(feature/<plan>)`. After all tickets are processed, update the status of each processed ticket's row in `.tasks/index.md` and report per ticket: DONE (commit hash), CHANGES_REQUESTED (gate + reason), BLOCKED (type).
- When every ticket of a plan is DONE, tell the user to run `/run-tickets-user`; it archives the plan. You do not move, archive, or rewrite plan files, and you do not edit `next_id`.

## Preconditions

- `status` is `REVIEW`, or `TESTING` with a Test Report result of PASS.
- If `deep_test: true`, a Test Report with `Result: PASS` must exist. Otherwise stop: status stays, add a Gate Log note.
- All tickets in `depends_on` are `DONE`.

## Gates (ALL must pass, check in this order)

1. **Scope:** every path in `git diff --name-only` (including untracked files) is inside `files_to_modify`, `test_files`, or the ticket's own `.tasks/` files. Any other path = FAIL.
2. **No new dependencies:** package manifests and lock files are unchanged unless the ticket explicitly allows it.
3. **Verification reports:** verify that testing was completed successfully. For `deep_test: true`, verify the ticket has a Test Report with `Result: PASS`. For `deep_test: false`, verify the Implementation Report documents passing `verify_command` output. Missing or failing test results = FAIL.
4. **Acceptance criteria:** check each criterion against the diff and test reports. Tick each box only with evidence. Any unmet criterion = FAIL.
5. **Hygiene:** no secrets, credentials, `.env` values, debug prints, commented-out code, or large generated files in the diff.
6. **Architecture:** no layer violation or new cross-module coupling versus ARCHITECTURE.md.
7. **Assumptions:** the Implementation Report lists no assumption that affects behavior, contract, or data format. Any such assumption = FAIL (set BLOCKED so the user or `/architect-reviewer-user unblock <id>` decides, not back to the Coder).

## Escalation

Follow `AGENTS.md` (section 4). If the ticket and architecture or plan conflict, or the report shows a guessed decision, set BLOCKED with the right `blocked_type` instead of CHANGES_REQUESTED.

## On FAIL

- Set `status: CHANGES_REQUESTED`, increment `retries`.
- Write precise, actionable reasons in the Gate Log (gate number, file, command output).
- If `retries >= max_retries`, set `status: BLOCKED` and describe the root cause for the user.
- Do NOT commit. Do NOT edit source or test files.

## On PASS: auto-commit (no confirmation needed)

Once every gate passes, commit immediately; do not ask the user.

1. Preflight on the current branch: `git diff --cached --name-only` must be empty
   (nothing staged by anyone else). If it is not empty, set BLOCKED (ENV) and list the paths.
2. Stage ONLY the ticket's paths by explicit path
   (`git add <path> <path>`), then commit with a pathspec so that only those files can enter the commit:
   `git commit -m "<ticket-id>: <title>" -m "<acceptance criteria met>" -- <path> <path>`
3. After the commit, verify `git show --name-only --format= HEAD` equals the staged list.
   If it contains any other path, do not touch history: set BLOCKED (ENV) with the evidence.
4. Record the commit hash in the Gate Log, set `status: DONE`, update the index row.
5. Never push, amend, force, reset, add . ,or rebase.

## Branch and Commit

All tickets within the same plan are committed sequentially to the `feature/<plan>` branch. Each ticket has a separate commit: `git commit -m "<ticket-id>: <title>" -m "<acceptance criteria met>" -- <path>...`. Once the plan is completed, the user merges the feature branch into main.

## Exit condition

Stop after updating the ticket, its index row, and (on PASS) the commit.
