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

## 2. UI / UX Direction — LOCKED

**Glassmorphism của SAOVN-OS là visual language chính và phải được giữ lại.** Không được thay bằng một dashboard template khác chỉ vì đang refactor kiến trúc.

Các đặc trưng cần giữ:
- nền tối có chiều sâu;
- panel kính mờ / `backdrop-filter: blur(...)`;
- border mảnh, trong suốt;
- ánh sáng xanh và gradient nhẹ;
- sidebar + topbar + card hierarchy hiện tại;
- responsive behavior hiện tại;
- không biến Experience Plane thành giao diện Admin.

Refactor Core/Access phải thay đổi **logic và data flow**, không phá hình thái UI đã được duyệt.

## 3. Legacy Members — LOCKED

**Không bắt thành viên cũ đăng ký lại.**

Firebase Auth hiện tại tiếp tục là Identity source cho tài khoản đã tồn tại. Login dùng `signInWithEmailAndPassword()` và không có flow tự đăng ký. Sau khi đăng nhập, hệ thống đọc `identities/{uid}` và membership hiện hữu để dựng runtime context.

People/Members tiếp tục đọc dữ liệu Identity/Membership hiện hữu. Các refactor Core phải tương thích với UID, identity document và membership document hiện tại.

Nguyên tắc migration:

```text
Existing Firebase Auth account
        ↓
Existing Identity / Membership
        ↓
Canonical Context Adapter
        ↓
New Experience Plane
```

Không được xóa hàng loạt, đổi UID hoặc yêu cầu recreate account chỉ vì thay Application Shell.

Nếu schema legacy cần nâng cấp, phải dùng **compatibility adapter / migration**, không ép người dùng đăng ký lại.

## 4. Core Architecture

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

## 5. Core Checkpoints

- Shared Application Shell + runtime bootstrap.
- Canonical access/capability/scope vocabulary.
- Registry-driven navigation + route guard.
- Runtime policy loading + realtime update + safe baseline.
- Module dependency/readiness validation.
- Identity/Membership context: `e161594845ac024a5f05bc54416a9b26f2fc4f3a`.
- Organization/Scope context: `c348d5d1b9c9aa1248dd622563f6f5e215b4de04`.
- Runtime Organization integration: `d974098025895aa5f600dd6250961945bfde976e`.
- Identity scope hardening: `d0e5e3041e4089304351565424caed63541a966f`.
- Shared access facade: `17e7e32e181195b01c2e46c71c055bc2808655dd`.
- Shared shell preserves organizational title without making title a UI/security boundary: `b0cad379ae8f9b1b8a4c4316794f11392a1e64c6`.
- Raw organizational roles are preserved alongside effective policy groups so CEO/Director/etc. do not become a second UI architecture: `986f4314768ed8cfd3c40be765b1308d07127065`.

## 6. People Context

File: `03_APPLICATION/WEB/js/core/people-context.js`

Checkpoint: `750873e937a28a4e2d8b38e223bc4bbabbbe7f12`.

Canonical read-model adapter for People/Members. It normalizes Identity + Membership into one person model containing identity, contact, title/position, organization, department, team, manager, roles, status and membership timestamps.

## 7. Shared Access Context

File: `03_APPLICATION/WEB/js/core/access-context.js`

Checkpoint: `17e7e32e181195b01c2e46c71c055bc2808655dd`.

The Experience Plane has a shared read-only access facade for modules/UI. It exposes identity, membership, scope, resolved capabilities, `can()` and module readiness helpers. Business modules should consume the facade rather than implementing their own role/permission resolver.

The facade does not grant security authority. Firestore Rules/backend remain authoritative.

## 8. Module Registry

Registry manages Dashboard, Work, Departments, Members, Projects, Attendance, Chat and Notifications. Each module declares `id`, `version`, `dependencies`, `capabilities`, `routes`, `navigation`, `events`. Missing/disabled dependencies are detected before module readiness.

## 9. Control Plane

Admin adjusts runtime policy, module enable/disable, role capabilities and system configuration. Frontend consumes configuration; Admin does not edit frontend code to control business behavior.

## 10. Work — FIRST BUSINESS MODULE

Existing functionality includes My Work, Tasks, Assignments, Deadlines, Progress, Kanban, Comments, Checklist, Activity, Mentions, Notifications foundation, Department/Team filtering, Member Work view and Admin Work management.

### Known issue — OPEN

`Member → assigned Work → Kanban status update` previously produced `FirebaseError: Missing or insufficient permissions`.

Work security is **not COMPLETE** until verified with real Admin + Member Firebase accounts and current Firestore Rules.

## 11. Communication / Notifications

Foundation exists for Conversations, Messages, unread state, Notifications, Badge, mentions and `@tất cả thành viên`.

## 12. Development Rules — LOCKED

1. One shared Experience Plane.
2. CEO → Intern use the same business Application Shell.
3. Admin is a separate Control Plane/back office.
4. No separate Admin/Member business applications for normal business modules.
5. Organizational title/position is display context, not permission logic.
6. Effective policy groups may map many positions to one capability policy without creating new UIs.
7. Core owns access vocabulary; modules consume it.
8. Frontend visibility is not security.
9. Firestore Rules/backend enforce security.
10. Admin changes policy/config; frontend reflects runtime state.
11. Modules declare dependencies/contracts.
12. Disabled or dependency-disabled modules must not run partially.
13. Identity/Membership/Scope go through canonical contexts.
14. Context/access facades are read-model layers, never security boundaries.
15. Existing Firebase members must remain compatible; no forced re-registration.
16. Glassmorphism visual language is preserved while architecture is refactored.
17. Every major checkpoint is committed and recorded here.
18. Do not mark a subsystem COMPLETE without real behavior verification.

## 13. Next Sequence

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
