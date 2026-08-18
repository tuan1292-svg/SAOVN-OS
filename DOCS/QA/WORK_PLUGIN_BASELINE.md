# SAOVN-OS — WORK PLUGIN BASELINE

This is the protected baseline for the current Work system before incremental plugin isolation.

| Plugin | Current state | Boundary state | Release rule |
|---|---|---|---|
| WORK.TASK | Production | Legacy parent boundary | Must not regress |
| WORK.CHECKLIST | Production | Legacy-bound | Must not regress |
| WORK.COMMENTS | Production | Legacy-bound | Must not regress |
| WORK.MENTIONS | Production | Legacy-bound | Must not regress |
| WORK.ANALYTICS | Production/optional | Legacy-bound | Must fail independently |
| WORK.CHAT | Not yet implemented as Work child plugin | New boundary | Must use plugin contract |

## Current production behavior to protect

### Task

- list and open Task
- create/update Task where authorized
- assignment
- Task detail

### Checklist

- load
- create/update/delete where authorized

### Comments

- load
- create
- update/delete according to existing authorization

### Mentions

- directory lookup
- `@` selection
- comment mention IDs
- Work mention notification

### Analytics

- optional analytics must not block Task detail when unavailable

## Isolation acceptance tests

1. Disable/fail Analytics → Task, Checklist, Comments, Mentions remain usable.
2. Disable/fail Chat → Task, Checklist, Comments, Mentions remain usable.
3. Change Chat permission → no Checklist/Comments/Mentions permission changes.
4. Change Checklist permission → no Comments/Mentions/Chat permission changes.
5. Mention notification failure → Comment persistence remains independent.
6. Chat message failure → Checklist and Comments remain independent.

## Baseline rule

This document describes the compatibility baseline. Do not rewrite the Work module wholesale. Migrate one child plugin at a time, test it, then continue.
