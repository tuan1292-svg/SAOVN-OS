# SAOVN-OS — PROJECT STATE

> Chốt sổ kỹ thuật: 22/08/2026 — Shared Experience Plane / Control Plane checkpoint

## 1. Product Direction — LOCKED

SAOVN-OS dùng một Experience Plane / Application Shell chung cho toàn bộ nhân viên, quản lý và lãnh đạo. Admin là Control Plane hậu phương. Cùng module nghiệp vụ, khác biệt theo Identity → Membership → Role → Scope → Capability → UI. Frontend không phải security boundary; backend/Firestore Rules là authority cuối cùng.

```text
CEO ─┐
Director ─┤
Manager ──┤
Staff ────┤──> ONE EXPERIENCE PLANE / ONE APPLICATION SHELL
Intern ───┘

Admin ─────────────> CONTROL PLANE / BACK OFFICE
```

Chức danh/vị trí không tạo ra một giao diện nghiệp vụ riêng. Quyền và phạm vi dữ liệu thay đổi theo policy/capability/scope trong cùng application.

## 2. Core Architecture

```text
CORE
├── Identity
├── Organization / Company / Department / Team
├── Membership
├── Role / Permission / Scope / Capability / Policy
├── Runtime Configuration
└── Module Registry

EXPERIENCE PLANE
├── Application Shell
├── Dashboard
├── Work
├── Organization / Departments
├── People / Members
├── Projects
├── Attendance
├── Chat
└── Notifications

CONTROL PLANE
└── Admin Control
```

## 3. Core Checkpoints

- Shared Application Shell + runtime bootstrap.
- Canonical access/capability/scope vocabulary.
- Registry-driven navigation + route guard.
- Runtime policy loading + realtime update + safe baseline.
- Module dependency/readiness validation.
- Identity/Membership context: `e161594845ac024a5f05bc54416a9b26f2fc4f3a`.
- Organization/Scope context: `c348d5d1b9c9aa1248dd622563f6f5e215b4de04`.
- Runtime Organization integration: `d974098025895aa5f600dd6250961945bfde976e`.

## 4. People Context

File: `03_APPLICATION/WEB/js/core/people-context.js`

Checkpoint: `750873e937a28a4e2d8b38e223bc4bbabbbe7f12`.

Canonical read-model adapter for People/Members. It normalizes Identity + Membership into one person model containing identity, contact, title/position, organization, department, team, manager, roles, status and membership timestamps.

## 5. Unified Experience Access Facade — NEW

File: `03_APPLICATION/WEB/js/core/experience-access.js`

Checkpoint: `53785f6ba62b22c114399186908649f40bb5155c`.

The shared Experience Plane now has one read-only access facade for modules/UI. It exposes user, identity, membership, organization, scope, role, capabilities, `can()`, `moduleEnabled()`, `canLoadModule()` and module metadata.

Business modules should consume this facade instead of creating separate role/permission resolution logic. The facade is not a security boundary; Firestore Rules/backend remain authoritative.

## 6. Module Registry

Registry manages Dashboard, Work, Departments, Members, Projects, Attendance, Chat and Notifications. Each module declares `id`, `version`, `dependencies`, `capabilities`, `routes`, `navigation`, `events`. Missing/disabled dependencies are detected before module readiness.

## 7. Control Plane

Admin adjusts runtime policy, module enable/disable, role capabilities and system configuration. Frontend consumes configuration; Admin does not edit frontend code to control business behavior.

## 8. Work — FIRST BUSINESS MODULE

Existing functionality includes My Work, Tasks, Assignments, Deadlines, Progress, Kanban, Comments, Checklist, Activity, Mentions, Notifications foundation, Department/Team filtering, Member Work view and Admin Work management.

### Known issue — OPEN

`Member → assigned Work → Kanban status update` previously produced `FirebaseError: Missing or insufficient permissions`.

Work security is **not COMPLETE** until verified with real Admin + Member Firebase accounts and current Firestore Rules.

## 9. Communication / Notifications

Foundation exists for Conversations, Messages, unread state, Notifications, Badge, mentions and `@tất cả thành viên`.

## 10. Development Rules — LOCKED

1. One shared Experience Plane.
2. CEO → Intern use the same business Application Shell.
3. Admin is a separate Control Plane/back office.
4. No separate Admin/Member business applications for normal business modules.
5. Core owns access vocabulary; modules consume it.
6. Frontend visibility is not security.
7. Firestore Rules/backend enforce security.
8. Admin changes policy/config; frontend reflects runtime state.
9. Modules declare dependencies/contracts.
10. Disabled or dependency-disabled modules must not run partially.
11. Identity/Membership/Scope go through canonical contexts.
12. Context/access facades are read-model layers, never security boundaries.
13. Every major checkpoint is committed and recorded here.
14. Do not mark a subsystem COMPLETE without real behavior verification.

## 11. Next Sequence

```text
People Context
  ↓
People / Organization integration
  ↓
Communication integration
  ↓
Work refactor onto canonical Scope + Capability
  ↓
Firestore Rules verification with real Admin + Member
  ↓
End-to-end regression
  ↓
Release
```

# END OF PROJECT STATE
