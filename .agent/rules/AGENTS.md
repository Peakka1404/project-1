# 0. Workflow Order & Model Assignment

The pipeline runs in strict order. Each step's agent, model, and output are listed below.

| Step | Agent                  | Model Preference                                           | Input                          | Output                             |
|------|------------------------|------------------------------------------------------------|--------------------------------|------------------------------------|
| 1    | `planner-user`         | Claude Sonnet (primary), Claude Opus (fallback)            | User request + ARCHITECTURE.md | `.tasks/draft_plan.md`             |
| 2    | `architect-reviewer-user` | Claude Opus (primary, if quota available), Gemini (fallback) | `draft_plan.md` + ARCHITECTURE.md | `.tasks/review-<plan>.md` (APPROVED) |
| 3    | `ticket-writer-user`   | Gemini only                                                | Approved plan                  | `.tasks/T-xxx.md` + index rows     |
| 4    | `run-tickets-user`     | Gemini only                                                | `.tasks/index.md`              | Orchestration, archival            |
| 5    | `coder-agent-user`     | Gemini only                                                | Ticket file                    | Code changes, Implementation Report|
| 6    | `tester-user`          | Gemini only                                                | Ticket (deep_test: true)       | Test Report                        |
| 7    | `gatekeeper-user`      | Gemini only                                                | Ticket (REVIEW/TESTING)        | Git commit or CHANGES_REQUESTED    |

**Rules:**
- Steps 3–7 MUST use Gemini. Do NOT use Claude for ticket writing, orchestration, coding, testing, or gatekeeping.
- The user may override model choice explicitly; that override takes precedence.
- If the primary model runs out of quota mid-step, the agent MUST stop, report the quota issue, and let the user switch to the fallback model. Never silently switch models.

# 1. Execution Rules

- Read the current ticket before changing code. Only act on tickets listed in .tasks/index.md.
- Read only files related to the ticket. Do not scan directories recursively via shell (Get-ChildItem, find, ls); use IDE file search or CodeGraph, then verify against the actual source.
- Inspect existing code and call relationships before editing; follow existing architecture and conventions.
- Check git status / diff before editing. Never revert unstaged changes or run destructive commands (git reset --hard, git checkout .) on files outside the ticket.
- If handing work to a new conversation, save a concise handoff: progress, changed files, tests, blockers.

# 1b. Git and Parallel Work

- One worktree per running ticket. run-tickets-user creates it with
  `git worktree add -b ticket/<id> ../wt-<id> <base-commit>` and records the path in the ticket.
  Never run two tickets in the same working directory, even if their files are disjoint:
  they would share one git index.
- Agents run git only inside their ticket's worktree.
- Allowed without asking: git status, diff, log, add <explicit path>, commit, branch, worktree add.
- Never: push, reset, rebase, clean, checkout ., add -A / add ., commit -a, commit --amend.
- Commits happen only through gatekeeper-user, one gatekeeper run per repository at a time.

# 2. Role & Skill Boundary (applies to EVERY agent)

- Use only the skill you were invoked with. Never open, read, or follow another agent's skill (tester, architect-reviewer, gatekeeper, run-tickets), and never scan .agents/.
- Roles: Planner drafts the initial plan. Architect designs, reviews, and unblocks. Ticket-writer creates tickets. Run-tickets orchestrates. Coder implements code. Tester writes and runs deep tests. Gatekeeper does final review.
- If your task seems to need another role's action, do NOT improvise: set `BLOCKED` with `blocked_type: SCOPE` and name the role that should do it.

# 3. Coder Rules

## Ticket boundary

- Modify ONLY files listed in `files_to_modify`; `context_files` are read-only.
- Do NOT add dependencies unless the ticket says so. No unrequested refactoring. Stop once the checklist is complete.
- Do NOT touch test files (reserved for the Tester).
- Pre-exit check: `git diff --name-only` must be a subset of `files_to_modify`.

## Testing (controlled by `deep_test` in the ticket)

- `deep_test: false` → run the ticket's `verify_command` and report its actual output. This is the ONLY test command you may run. Do not call pytest directly, change its flags or scope, or run other test files.
- `deep_test: true` → do NOT run tests (the Tester does). Run `verify_command` only if the ticket provides one and it is a build/lint/type check.
- `verify_command` missing (when `deep_test: false`) → STOP, BLOCKED (AMBIGUOUS). Never invent a command or look up how to run tests elsewhere.
- Test fails because of your change → fix it (see FAILING). If the fix requires editing a test file → BLOCKED (SCOPE).

## Task files

- Never read .tasks/archive/ unless the user explicitly asks.
- A leftover .tasks/draft_plan.md is a pending plan, not an instruction to implement.

# 4. Escalation Protocol (applies to EVERY agent)

Principle: if you cannot proceed without choosing between interpretations, STOP. A blocked ticket is cheaper than a silently guessed decision.

## Source precedence (when sources disagree)

1. Latest explicit instruction from the user
2. The ticket (contract, acceptance criteria)
3. docs/ARCHITECTURE.md
4. Existing code and conventions
5. Skill / agent defaults

Resolve a conflict yourself ONLY if a higher source clearly overrides a lower one AND the outcome does not change observable behavior. If two sources at the same level disagree, or the outcome changes behavior, STOP.

## Stop conditions (set status BLOCKED)

- AMBIGUOUS caused by a missing or wrong ticket field (e.g. verify_command, deep_test): architect-reviewer via /unblock.
- CONFLICT: ticket, architecture doc, code, or user instructions contradict each other.
- SCOPE: needs a file outside files_to_modify / test_files / an out_of_scope file, or an action belonging to another role.
- ENV: baseline is broken before your change (tests already failing, build or verify_command cannot run, tool missing). Do not fix pre-existing breakage.
- DEPENDENCY: a depends_on ticket is not DONE, or its real interface differs from the contract.
- FAILING: the same check still fails after 2 genuinely different fix attempts. Do not thrash.
- UNSAFE: the only way forward is destructive or irreversible (data loss, history rewrite).
- TOOLING: CodeGraph output contradicts the source and you cannot tell which is right. (Trust the source, note the discrepancy; STOP only if undecidable.)

## Anti-guess signals

If you are about to write "I'll assume", "probably", "most likely", or are picking between two designs that both satisfy the ticket:

- Allowed ONLY if the difference is purely internal (no change to behavior, contract, data format, or public interface). Record it under "Assumptions" in your report.
- Otherwise STOP. Never fill a gap with a guess and report the ticket as complete.

## Partial work

Do not leave half-implemented behavior. Either finish a clearly separable part that passes its checks, or leave no behavioral changes. State exactly what changed in the Blocker report.

## How to block

1. Set `status: BLOCKED` and `blocked_type: AMBIGUOUS|CONFLICT|SCOPE|ENV|DEPENDENCY|FAILING|UNSAFE`.
2. Fill the ticket's Blockers section: Type; What I was doing; Evidence (file:line, command output); Options (A / B, each with its consequence); Recommendation (optional); What I did NOT do; State of the working tree.
3. Reply in chat in at most 3 lines, then stop. Do not start another ticket.

## Who resolves

- AMBIGUOUS / CONFLICT about requirements, ENV, UNSAFE: the user.
- CONFLICT / SCOPE / DEPENDENCY about contract or design: architect-reviewer via /unblock.
- FAILING: architect-reviewer first (the ticket may be flawed), then the user.
