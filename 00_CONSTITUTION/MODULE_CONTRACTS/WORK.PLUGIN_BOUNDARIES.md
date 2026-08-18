# SAOVN-OS — WORK PLUGIN BOUNDARIES

**Version:** 1.0
**Status:** Design baseline

## 1. Purpose

This document freezes the boundaries of the Work child plugins before implementation refactoring begins.

The goal is isolation: adding or changing one Work plugin must not silently change the behavior or authorization of sibling plugins.

## 2. Plugin tree

```text
WORK
├── WORK.TASK
├── WORK.CHECKLIST
├── WORK.COMMENTS
├── WORK.MENTIONS
├── WORK.ANALYTICS
└── WORK.CHAT
```

## 3. Ownership

| Plugin | Owns | May consume |
|---|---|---|
| WORK.TASK | task lifecycle and task identity | CORE.AUTH, CORE.IDENTITY, CORE.MEMBERSHIP, CORE.PERMISSION |
| WORK.CHECKLIST | checklist items | WORK.TASK read contract |
| WORK.COMMENTS | task discussion records | WORK.TASK read contract, CORE.IDENTITY |
| WORK.MENTIONS | mention resolution and mention events | WORK.TASK read contract, CORE.IDENTITY, CORE.NOTIFICATION |
| WORK.ANALYTICS | Work-derived metrics | published Work read/analytics contracts |
| WORK.CHAT | Work-scoped conversations | WORK.TASK read contract, CORE.IDENTITY, CORE.NOTIFICATION |

A plugin may consume a declared contract but must not access a sibling's private implementation or private collection directly.

## 4. Permission isolation

Each plugin owns a namespace:

```text
WORK.TASK.*
WORK.CHECKLIST.*
WORK.COMMENTS.*
WORK.MENTIONS.*
WORK.ANALYTICS.*
WORK.CHAT.*
```

Granting `WORK.CHAT.CREATE` must never imply `WORK.CHECKLIST.CREATE`, `WORK.COMMENTS.CREATE`, or `WORK.MENTIONS.CREATE`.

The shared question "may this user access the parent Task?" is a dependency on the `WORK.TASK.READ` contract, not a permission grant to every child plugin.

## 5. Data isolation

New plugins must prefer child-owned collections rather than adding unrelated fields to the parent Task document.

Target pattern:

```text
workTasks/{taskId}
workTasks/{taskId}/checklist/{itemId}
workTasks/{taskId}/comments/{commentId}
workTasks/{taskId}/mentions/{mentionId}
workTasks/{taskId}/analytics/{recordId}
workTasks/{taskId}/chatThreads/{threadId}
```

For existing legacy collections, the current path remains protected by a compatibility boundary until a deliberate migration is completed.

## 6. Event isolation

Cross-plugin communication uses named events/contracts.

Examples:

```text
WORK.TASK.OPENED
WORK.TASK.UPDATED
WORK.MENTIONS.CREATED
WORK.CHAT.MESSAGE_CREATED
```

A plugin must not depend on another plugin's DOM implementation or private JavaScript state.

## 7. Failure isolation

A child plugin may fail closed without taking sibling plugins down.

Examples:

- Analytics permission failure must not prevent Task detail from opening.
- Chat failure must not prevent Checklist from loading.
- Mention notification failure must not prevent a comment from being saved.
- Checklist failure must not prevent Comments from loading.

The parent Task experience may remain available while an optional child plugin reports its own error state.

## 8. Change rule

A change to one plugin must list:

1. the plugin being changed;
2. declared dependencies;
3. owned data touched;
4. permission namespace touched;
5. events touched;
6. regression tests for sibling plugins.

If a change requires modifying a sibling's private implementation, stop and redesign the contract before merging.

## 9. Migration rule

Existing Work code is treated as legacy-bound until migrated. No broad rewrite is allowed merely to satisfy this document.

Migration is incremental:

```text
baseline → isolate one plugin → regression → migrate next plugin
```

## 10. Definition of done

A Work plugin is considered isolated only when:

- its ID is registered;
- its contract is documented;
- its permission namespace is explicit;
- its data ownership is explicit;
- dependencies are one-way and declared;
- sibling plugins still pass regression;
- failure of the plugin does not block unrelated sibling features;
- rollback can remove the plugin without reverting unrelated plugins.
