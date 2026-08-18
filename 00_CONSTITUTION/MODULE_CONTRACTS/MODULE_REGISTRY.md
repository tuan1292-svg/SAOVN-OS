# SAOVN-OS — MODULE REGISTRY

**Purpose:** single registry of module IDs and boundaries.

> This registry is architectural metadata. It does not itself grant Firestore access.

| Module ID | Parent | Status | Permission namespace | Data owner |
|---|---|---|---|---|
| CORE.AUTH | CORE | ACTIVE | `CORE.AUTH.*` | Auth infrastructure |
| CORE.IDENTITY | CORE | ACTIVE | `CORE.IDENTITY.*` | identities |
| CORE.MEMBERSHIP | CORE | ACTIVE | `CORE.MEMBERSHIP.*` | memberships |
| CORE.PERMISSION | CORE | ACTIVE | `CORE.PERMISSION.*` | authorization contracts |
| CORE.NOTIFICATION | CORE | ACTIVE | `CORE.NOTIFICATION.*` | notifications |
| WORK.TASK | WORK | ACTIVE | `WORK.TASK.*` | workTasks |
| WORK.CHECKLIST | WORK | LEGACY-BOUNDARY | `WORK.CHECKLIST.*` | task checklist |
| WORK.COMMENTS | WORK | LEGACY-BOUNDARY | `WORK.COMMENTS.*` | task comments |
| WORK.MENTIONS | WORK | LEGACY-BOUNDARY | `WORK.MENTIONS.*` | mention records |
| WORK.ANALYTICS | WORK | LEGACY-BOUNDARY | `WORK.ANALYTICS.*` | derived/aggregate data |
| WORK.CHAT | WORK | PLANNED | `WORK.CHAT.*` | Work chat |
| ATTENDANCE | PEOPLE | ACTIVE | `ATTENDANCE.*` | attendanceDays / attendanceSessions |

## Status meanings

- `ACTIVE`: currently implemented and protected by production regression.
- `LEGACY-BOUNDARY`: implemented but storage/code is still coupled to the historical parent structure; do not perform destructive refactor without migration.
- `PLANNED`: contract reserved; implementation must follow the module specification.

## Registry rules

1. Module IDs are immutable after production adoption.
2. A new plugin must be registered before implementation is merged.
3. Permission namespace must match Module ID.
4. Collection ownership must be explicit.
5. Registry status must not be interpreted as a security grant.
