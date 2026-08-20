# SAOVN-OS — Firestore Security Rule Contracts

> Checkpoint: 2026-08-20
> Branch: `chore/engineering-governance`
>
> This contract defines the boundaries before we change the live `firestore.rules` behavior.

## Rule 0 — No cross-branch repair

A defect in one branch must not be repaired by widening permissions in another branch.

- ADMIN defect → modify ADMIN only.
- MEMBER defect → modify MEMBER only.
- WORK defect → modify WORK only.
- CORE changes require regression of every consuming branch.

## Rule 1 — Work task scope is the root of Work child capabilities

For `/workTasks/{taskId}` a user may enter the Work child branches only when `canReadTaskData(task)` is true.

Current intended Work access identities:

- task creator
- explicitly assigned UID in `assigneeIds`
- legacy `assigneeId`
- management scope (admin / manager / department head / team lead according to task scope)

## Rule 2 — Checklist contract

Path: `/workTasks/{taskId}/checklist/{itemId}`

- READ: Work task reader
- CREATE: Work task reader
- UPDATE: Work task reader
- DELETE: Work task reader

No checklist rule may grant access to another top-level branch.

## Rule 3 — Comments contract

Path: `/workTasks/{taskId}/comments/{commentId}`

- READ: Work task reader
- CREATE: Work task reader + `authorId == request.auth.uid`
- UPDATE: author or privileged Work user
- DELETE: author or privileged Work user

No comment rule may modify identity, membership, admin, or member permissions.

## Rule 4 — Work directory contract

Work directory data exists only to resolve display identity for Work UI.

It must not become a general-purpose Admin/Members permission gate.

## Rule 5 — Admin contract

ADMIN owns administrative operations:

- memberships
- identities administration
- departments
- roles
- projects administration
- system

A Work repair must not alter these contracts.

## Rule 6 — Member contract

MEMBER owns member-facing operations:

- own profile/identity
- attendance
- member project access
- own notifications

A Work repair must not alter these contracts.

## Regression gate

Before a branch is marked `LOCKED`:

1. Test the changed leaf.
2. Test sibling leaves in the same branch.
3. Test the previously passing top-level branches.
4. Record the result in `SECURITY_RULE_TREE.md`.

## Current target

Repair only:

- `WORK.TASK`
- `WORK.CHECKLIST`
- `WORK.COMMENTS`

for the known ACTIVE Member:

`49jMcXigONdASEPDpvco02EaHPx1`

Do not publish a new Rules version until the contract implementation is reviewed and the regression gate is ready.