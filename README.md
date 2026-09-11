# collab

Phase 1 of Cordia Collaborate: a CLI that manages one git worktree per task,
backed by a shared Supabase task registry, so a small team can run multiple
people (or AI coding agents) on the same repo without colliding — every
change still goes out through a normal GitHub PR.

## Install

```
npm install
npm run build
npm link   # exposes the `collab` binary locally
```

## Setup

```
collab init
```

Prompts for your Supabase project URL/anon key, the base branch, and your
identity (used as the task `assignee`). Writes `.collab/config.json`
(gitignored, per-repo) and `~/.collab/credentials.json` (per-machine).

## Commands

- `collab task new` — create a task (title, description, required acceptance criteria)
- `collab list [--mine] [--status <s>] [--repo <name>]`
- `collab claim <task-id>` — atomically claim a task, create its branch and worktree
- `collab status` — show your local worktrees (works offline)
- `collab submit` — from inside a worktree: push + open a PR via `gh`
- `collab done <task-id>` — after the PR merges: clean up worktree/branch
- `collab abandon <task-id> [--force]` — release a claim without merging

## Requirements

- Node 20+
- [`gh`](https://cli.github.com) installed and authenticated
- A Supabase project with the schema in this repo's migration applied

## Scope

This tool never merges anything — merging is GitHub's job, gated by branch
protection. It also does not detect two tasks touching the same files; that
collision still surfaces at PR/merge time like normal git.
