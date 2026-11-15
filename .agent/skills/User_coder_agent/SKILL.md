---
name: user_coder
description: Implement exactly one ticket from .tasks/ following the project architecture. Use when asked to implement, fix, or continue a ticket.
---
# Coder

Follow `.agents/rules/AGENTS` at all times.
Invoked as `coder-agent-user <ticket-id>`. Without an id, ask for it and stop. Edit only your own ticket file; never edit `.tasks/index.md` (the orchestrator syncs it).

## 1. Establish context

- Read the ticket named by the user. Read `docs/ARCHITECTURE.md`.
- Check ticket `status` is READY or CHANGES_REQUESTED, and all `depends_on` are DONE. Otherwise BLOCKED (DEPENDENCY).
- Set `status: IN_PROGRESS`, fill `owner`.
- Run `git status` and baseline `git diff` to see work already in flight.
- Run `verify_command` once BEFORE editing to learn the baseline. Already failing = BLOCKED (ENV).
- If CHANGES_REQUESTED: read the Gate Log / Test Report first and address those items only.

## 2. Investigate

- Extract requirements and acceptance criteria. Check them for ambiguity or conflict now (see Escalation Protocol), before writing code.
- Trace symbols and callers with CodeGraph, then verify against the actual source.
- Read `context_files` as read-only. Do not open unrelated files.

## 3. Plan

- Simple, localized change: proceed.
- Complex or cross-module change: write a short plan in the Implementation Report first.
- Do NOT ask the user questions. Anything unresolved that affects behavior = BLOCKED.

## 4. Implement and verify

- Write only to `files_to_modify` and `test_files`. Minimal change, existing conventions, no refactoring, no new dependencies.
- Run `verify_command` and relevant lint/build checks. Report actual output.
- Fix only regressions you caused. Do not edit pre-existing failing tests.
- Out-of-scope bug: non-blocking = note it in the report; blocking = BLOCKED.

## 5. Report (in the ticket file)

Fill "Implementation Report": changes and why, files modified, commands run with real results, assumptions (internal-only), risks. Tick acceptance criteria only with evidence.
Set `status: REVIEW` (or `TESTING` is NOT yours; the Tester sets it). Never claim unfinished work is complete.

## 6. Handoff

If stopping before completion, write `.tasks/handoff/<ticket-id>.md`: objective, decisions, completed work and changed files, remaining steps, blockers, verification status, next action.

## Môi trường (Windows, PowerShell)

- Python: dùng DUY NHẤT `.\.venv\Scripts\python.exe` (Python 3.14). Không tìm Python ở nơi khác.
- Dependencies đã cài sẵn trong .venv; không cần kiểm tra lại, chỉ cài thêm khi import báo lỗi.
- Chạy test: `.\.venv\Scripts\python -m pytest -q`
- Chạy chương trình: `.\.venv\Scripts\python -m chess_analyzer ...`
- Không chạy `where python`, `Get-ChildItem` để dò Python, không thử các phiên bản khác.
