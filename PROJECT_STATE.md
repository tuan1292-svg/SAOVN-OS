# SAOVN-OS — PROJECT STATE

> Chốt sổ kỹ thuật: 22/08/2026 — Experience Plane / Control Plane refactor checkpoint

## 1. Product Direction — LOCKED

SAOVN-OS dùng một Experience Plane / Application Shell chung cho CEO, lãnh đạo, quản lý, nhân viên và thực tập sinh. Admin là Control Plane hậu phương. Cùng module nghiệp vụ, khác biệt theo Identity → Membership → Position/Role → Scope → Capability → UI. Frontend không phải security boundary; backend/Firestore Rules là authority cuối cùng.

```text
CEO ─┐
Director ─┤
Manager ──┤
Staff ────┤──> ONE EXPERIENCE PLANE / ONE APPLICATION SHELL
Intern ───┘

Admin ─────────────> CONTROL PLANE / BACK OFFICE
```

## 2. UI / UX Direction — LOCKED

Glassmorphism là visual language chính: nền tối có chiều sâu, panel kính mờ/backdrop blur, border mảnh, ánh sáng xanh/gradient nhẹ, sidebar + topbar + card hierarchy và responsive behavior. Refactor logic/data flow không được phá hình thái này.

## 3. Legacy Members — LOCKED

Không bắt thành viên cũ đăng ký lại. Firebase Auth hiện tại tiếp tục là Identity source. Login dùng tài khoản đã cấp; runtime đọc identities/{uid} và membership hiện hữu.

## 4. Architecture — LOCKED

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

## 5. Completed foundations

- Shared Application Shell + runtime bootstrap.
- Canonical access/capability/scope vocabulary.
- Registry-driven navigation + route guard.
- Runtime policy loading/readiness foundation.
- Identity/Membership context.
- Organization/Scope context.
- Shared access facade.
- Shared shell preserves organizational title without making title a UI/security boundary.
- Raw organizational roles preserved alongside effective policy groups.
- People context exposed through authenticated runtime.
- People controls gated by capabilities.
- Communication context uses existing Firebase Identity/Membership.
- Chat bootstraps Communication Context.
- Work read query aligned to assigned/owned/department/team predicates.
- Work capability aliases aligned to canonical work.task.* vocabulary.
- Work collaboration foundation for Checklist + Comments.
- Work scope maps executive positions to management scope without making them Admin.

## 6. Current reality — IMPORTANT

The repository contains substantial Core/Access/Work foundation, but the deployed UI is **NOT yet a Release Candidate**. The current web application still contains legacy and newly refactored pieces together. Do not represent the current deployment as finished product.

The immediate product task is now to consolidate the Experience Plane into one coherent glassmorphism application shell, then integrate the existing modules into that shell instead of continuing to patch isolated screens.

## 7. Work — OPEN

Existing functionality/contracts cover Tasks, Assignments, Deadlines, Progress, Kanban, Comments, Checklist, Activity and Department/Team filtering, but real Firebase verification is still required.

Still OPEN:
- real Member task read;
- Kanban status update;
- task content update;
- checklist read/write;
- comments read/write;
- activity/realtime collaboration;
- Admin + Member Rules verification;
- end-to-end regression.

Do not mark Work COMPLETE until tested against deployed Rules with real accounts.

## 8. Communication — FOUNDATION

Conversation/message/notification foundation exists and uses existing Identity/Membership. No forced re-registration.

## 9. Control Plane — FOUNDATION

Admin is intended to control runtime policy, module enable/disable, capabilities and configuration from a separate backend/admin surface. Normal business users do not receive an Admin UI merely because of their organizational position.

## 10. Next Build Sequence — LOCKED

```text
CURRENT
  ↓
1. Consolidate ONE Experience Plane / Glass Application Shell
  ↓
2. Clean legacy/new UI overlap
  ↓
3. Integrate People / Organization / Communication / Work into Shell
  ↓
4. Finish Work child resources + realtime behavior
  ↓
5. Verify Firestore Rules with real Admin + Member accounts
  ↓
6. End-to-end regression
  ↓
7. Deploy public Release Candidate
  ↓
8. User acceptance test
  ↓
9. Release
```

## 11. Development Rules — LOCKED

1. One shared Experience Plane.
2. CEO → Intern use the same business Application Shell.
3. Admin is a separate Control Plane/back office.
4. Organizational title/position is display context, not permission logic.
5. Effective policy groups may map many positions to one capability policy without creating new UIs.
6. Core owns access vocabulary; modules consume it.
7. Frontend visibility is not security.
8. Firestore Rules/backend enforce security.
9. Admin changes policy/config; frontend reflects runtime state.
10. Existing Firebase members remain compatible; no forced re-registration.
11. Glassmorphism visual language is preserved.
12. Every major checkpoint is committed and recorded here.
13. Do not mark a subsystem COMPLETE without real behavior verification.
14. Do not call a deployment a Release Candidate merely because Vercel reports READY.

## 12. Sleep Checkpoint

The project is intentionally left **OPEN**, not falsely marked finished. The next session should start by consolidating the visible product shell and cleaning the current UI before adding more architecture.

# END OF PROJECT STATE
