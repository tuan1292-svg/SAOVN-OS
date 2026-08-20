# SAOVN-OS — Firestore Security Rule Tree

> Security architecture checkpoint — 2026-08-20
>
> Firestore still publishes one `firestore.rules` file. This document defines the internal tree/boundary structure that file must follow.

## 1. Root

```text
ROOT
└── CORE
    ├── AUTH
    ├── IDENTITY
    ├── MEMBERSHIP
    └── ORGANIZATION
```

CORE is the root dependency layer. A CORE change is high-impact and requires regression of every branch that consumes it.

## 2. Top-level branches

```text
ROOT
├── CORE
├── ADMIN
├── MEMBER
└── WORK
```

A top-level branch owns its own capabilities. A branch must not widen another branch's permissions as a side effect of fixing its own feature.

## 3. ADMIN branch

```text
ADMIN
├── MEMBERS
├── IDENTITIES
├── DEPARTMENTS
├── ROLES
├── PROJECTS
└── SYSTEM
```

Admin fixes must remain inside ADMIN unless the change is explicitly a CORE contract change.

## 4. MEMBER branch

```text
MEMBER
├── PROFILE
├── ATTENDANCE
├── PROJECTS
└── NOTIFICATIONS
```

Member fixes must not modify ADMIN capabilities.

## 5. WORK branch

```text
WORK
├── DIRECTORY
├── TASK
│   ├── READ
│   ├── CREATE
│   ├── UPDATE
│   └── DELETE
├── CHECKLIST
│   ├── READ
│   ├── CREATE
│   ├── UPDATE
│   └── DELETE
├── COMMENTS
│   ├── READ
│   ├── CREATE
│   ├── UPDATE
│   └── DELETE
├── MENTIONS
├── ANALYTICS
└── CHAT
```

WORK fixes must not modify ADMIN or MEMBER permissions merely to make a Work feature function.

## 6. Locking model

Each branch/leaf has one of three states:

- `LOCKED` — verified PASS; do not modify during unrelated work.
- `OPEN` — under active development.
- `BROKEN` — known failing capability being repaired.

A locked node can only be changed through an explicit impact review and regression of all dependent nodes.

## 7. Current baseline

```text
CORE
├── AUTH                 OPEN
├── IDENTITY             OPEN
├── MEMBERSHIP           OPEN
└── ORGANIZATION         OPEN

ADMIN
├── MEMBERS              OPEN  # previously relatively stable; must be regression-protected
├── IDENTITIES           OPEN
├── DEPARTMENTS          OPEN
├── ROLES                OPEN
├── PROJECTS             OPEN
└── SYSTEM               OPEN

MEMBER
├── PROFILE              OPEN
├── ATTENDANCE           OPEN
├── PROJECTS             OPEN
└── NOTIFICATIONS        OPEN

WORK
├── DIRECTORY            OPEN
├── TASK                 OPEN
├── CHECKLIST            BROKEN
├── COMMENTS             BROKEN
├── MENTIONS             PASS history / requires regression
├── ANALYTICS            OPEN
└── CHAT                 OPEN
```

No node is marked `LOCKED` yet because the current Rules baseline has already produced cross-branch regressions. We lock nodes only after a clean regression gate.

## 8. Change rule

```text
change leaf
  ↓
regression leaf
  ↓
regression branch
  ↓
regression sibling branches if shared CORE/helper changed
  ↓
LOCK only after evidence
```

Never use a broad `allow read/write` rule as a shortcut for a child capability.

## 9. Current Work Member target

The immediate target remains:

```text
WORK.TASK
WORK.CHECKLIST
WORK.COMMENTS
```

for an authenticated Member who is explicitly assigned to the Task.

The known test Member is:

```text
UID: 49jMcXigONdASEPDpvco02EaHPx1
Membership: mem_49jMcXigONdASEPDpvco02EaHPx1_org_saovn_01
Role: org_member
Position: INTERN
Status: ACTIVE
```

The target is to make these capabilities pass without changing ADMIN/MEMBER branches outside their declared contracts.
