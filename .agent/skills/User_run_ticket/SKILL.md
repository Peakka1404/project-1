---
name: user_ticket_run
description: Orchestrate implementation. Lists ready tickets, checks parallel safety, starts or prepares one coder agent per ticket, syncs the index, and archives finished plans. Use to run the next batch of tickets or check progress. Never edits source or test code.
---
# Run Tickets (Orchestrator)

Follow `AGENTS.md`. You do NOT edit `src/` or `test/`, and you never implement a ticket in this conversation. You are the only role that archives a finished plan.

## Steps

1. Read `.tasks/index.md` and the frontmatter of every ticket in `.tasks/` (never `.tasks/archive/`). The ticket frontmatter is the source of truth: re-sync the `index.md` rows from it (status, blocked_type, branch, plan).
2. Archive finished plans. For each `plan` value whose tickets are ALL `DONE`:
   - Move `.tasks/review-<plan>.md`, that plan's `T-*.md` files, and its `.tasks/handoff/` files into `.tasks/archive/<plan>/`.
   - Move that plan's rows (only the table with columns `| id | title | status | blocked_type | depends_on | parallel_group | deep_test | branch | plan |`) into `.tasks/archive/<plan>/.index.md`. The table left in `index.md` keeps its header and the rows of the other plans.
   - If the plan belongs to a roadmap (`roadmap-<slug>.md`), set that plan to DONE in the roadmap. Do not touch the roadmap otherwise.
   - Do NOT edit `next_id` (the Ticket-writer maintains it when creating tickets). Do not open `.tasks/archive/` afterwards.
   - If the plan introduced or modified contracts under `docs/contracts/<plan>.md`, notify the user to run `/architect-reviewer-user sync <plan>` to update `docs/ARCHITECTURE.md`.
3. Ready = status READY or CHANGES_REQUESTED, and every `depends_on` is DONE.
4. Choose the next runnable set. Theo Feature Branch Workflow: đảm bảo branch `feature/<plan>` đã được tạo và checkout trong workspace. Cập nhật trường `branch: feature/<plan>` cho ticket chuẩn bị chạy. Không tạo worktree riêng cho từng ticket. Các ticket trong plan được thực hiện tuần tự trên cùng một feature branch.
5. When asked to check progress, re-sync and report per ticket:
   - REVIEW: next step is `/tester-user <id>` if `deep_test: true`, otherwise `/gatekeeper-user`.
   - TESTING: next step is `/gatekeeper-user <id>`.
   - BLOCKED: blocked_type + one-line reason. Next step by type, following `AGENTS.md` ("Who resolves"): ticket defect -> `/ticket-writer-user amend <id>`; design, contract, scope, dependency, or FAILING -> `/architect-reviewer-user unblock <id>`; requirements, ENV, UNSAFE -> the user.
   - TODO with a non-empty Decisions section: waiting for `/ticket-writer-user amend <id>`.
   - Still running.
6. When there is nothing left to run, say what comes next:
   - An approved `review-<plan>.md` that has no tickets yet: `/ticket-writer-user <plan>`.
   - A roadmap with a PENDING plan and all earlier plans DONE: `/architect-reviewer-user next`.
   - A plan with contracts was just archived: `/architect-reviewer-user sync <plan-slug>`.
   - Otherwise: all work is done and the user merges the DONE branches.

## Model preference

- **Primary:** Claude Sonnet — reliable state synchronization, dependency ordering, and orchestration. Use when quota is available.
- **Fallback:** Gemini Argon — use when Claude Sonnet quota is exhausted or unavailable.
- If the primary model runs out of quota mid-step, stop and report to the user so they can switch models. Never silently switch.
