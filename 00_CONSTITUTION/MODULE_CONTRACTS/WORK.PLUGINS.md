# SAOVN-OS — WORK PLUGIN CONTRACTS

**Parent:** `WORK`  
**Status:** Architecture baseline / migration target

## 1. Work plugin tree

```text
WORK
├── WORK.TASK
├── WORK.CHECKLIST
├── WORK.COMMENTS
├── WORK.MENTIONS
├── WORK.ANALYTICS
└── WORK.CHAT
```

## 2. Contracts

| Plugin | Owns | Reads/depends on | Permission namespace |
|---|---|---|---|
| WORK.TASK | Task, assignment, status | Identity, Membership | `WORK.TASK.*` |
| WORK.CHECKLIST | Checklist items | `WORK.TASK.READ` | `WORK.CHECKLIST.*` |
| WORK.COMMENTS | Task comments | `WORK.TASK.READ` | `WORK.COMMENTS.*` |
| WORK.MENTIONS | Mention records/commands | `WORK.TASK.READ`, Comments contract, Notification contract | `WORK.MENTIONS.*` |
| WORK.ANALYTICS | Work aggregates | published Work read contracts | `WORK.ANALYTICS.*` |
| WORK.CHAT | Work-scoped chat | `WORK.TASK.READ`, Notification contract | `WORK.CHAT.*` |

## 3. Example: adding Work Chat

When `WORK.CHAT` is enabled:

```text
WORK.TASK
    │
    └── TASK.OPENED
             │
             ▼
        WORK.CHAT
```

Chat may use the Task ID from the event. It does not mutate Task, Checklist, Comments, or Mentions data directly.

Chat permission changes are scoped to `WORK.CHAT.*`.

## 4. Current-state migration rule

The existing production implementation may still use legacy paths such as:

```text
workTasks/{taskId}/comments
workTasks/{taskId}/checklist
```

These paths are **legacy storage contracts** until migrated. Do not perform a destructive storage migration merely to satisfy this specification.

Migration must be incremental:

```text
legacy path
→ compatibility adapter
→ plugin-owned contract
→ regression
→ optional migration
```

## 5. Compatibility requirement

Until migration is complete, existing Work features must remain operational. A new plugin may not require a rewrite of Checklist, Comments or Mentions merely to launch.

## 6. Required future implementation structure

Recommended application boundary:

```text
03_APPLICATION/WEB/js/modules/work/
├── task/
├── checklist/
├── comments/
├── mentions/
├── analytics/
└── chat/
```

Each folder should expose a small public API and keep implementation private.

## 7. Permission test examples

Adding Chat must prove:

```text
WORK.CHAT.READ     → PASS/FAIL independently
WORK.CHAT.CREATE   → PASS/FAIL independently
WORK.CHECKLIST.*   → unchanged
WORK.COMMENTS.*    → unchanged
WORK.MENTIONS.*    → unchanged
```

## 8. Contract rule

A child plugin may depend on a parent capability, but it cannot silently inherit all parent permissions.

Example:

```text
WORK.CHAT
  requires WORK.TASK.READ
  does NOT imply WORK.CHECKLIST.CREATE
  does NOT imply WORK.COMMENTS.DELETE
```
