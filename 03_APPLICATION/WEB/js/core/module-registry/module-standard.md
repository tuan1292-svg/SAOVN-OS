# SAOVN-OS Module Standard

## Purpose

Every new feature must be installable as an isolated module/plugin. A module must expose a small public contract and must not reach into another module's private implementation.

## Required identity

Each module declares:

- `MODULE_ID`: stable dotted identifier, e.g. `WORK.CHAT`.
- `VERSION`: semantic version.
- `PARENT`: parent domain, e.g. `WORK`.
- `DEPENDENCIES`: other module IDs/contracts required at runtime.
- `CAPABILITIES`: public operations exposed by the module.
- `DATA_OWNER`: Firestore path owned by the module.
- `PERMISSION_NAMESPACE`: Rules boundary owned by the module.

## Boundaries

1. A module owns its data paths.
2. A module owns its Firestore permission namespace.
3. A module may consume another module only through its public contract/adapter.
4. A module must not import another module's private implementation.
5. A module must not directly mutate another module's DOM/state.
6. A module must fail closed: if its dependency is unavailable, the host module continues operating.
7. New functionality must not broaden an existing module's Rules unless that module's contract explicitly requires it.
8. UI loading should be lazy when the feature is optional.

## Work example

```text
WORK
├── TASK
├── COMMENTS
├── CHECKLIST
├── MENTIONS
├── ANALYTICS
└── CHAT
```

Example isolated data boundary:

```text
workTasks/{taskId}/chat/{messageId}
```

Example permission boundary:

```text
WORK.CHAT
```

A Chat change must not require changing the permissions for `WORK.TASK`, `WORK.COMMENTS`, or `WORK.CHECKLIST` unless an explicit dependency is added and reviewed.

## File-size and responsibility rule

Do not grow a monolithic feature file when a new responsibility can be isolated. Prefer:

```text
feature/
├── feature.contract.js
├── feature.adapter.js
├── feature.service.js
├── feature.ui.js
├── feature.events.js
└── feature.permission.js
```

The bootstrap layer assembles modules; it does not contain their business logic.

## Safe migration rule

Existing production functionality must not be rewritten in one large migration. Extract one responsibility at a time, keep the old behavior as the compatibility boundary, validate it, then remove the duplicated legacy path only after regression testing.

## Change gate

Before merging a module change, verify:

- Existing module behavior is unchanged.
- New Firestore paths are isolated.
- Rules are scoped to the new module.
- Dependencies are explicit.
- Failure of the new module does not block the host module.
- Existing authentication, attendance, tasks, comments, checklist, mentions, analytics, and file flows have a regression check when touched.
