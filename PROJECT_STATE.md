# SAOVN-OS — PROJECT STATE

> Chốt sổ kỹ thuật: 21/08/2026 — Shared Experience Plane / Control Plane checkpoint

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

## 2. Product Direction — LOCKED

SAOVN-OS dùng **một Experience Plane / Application Shell chung** cho toàn bộ nhân viên, quản lý và lãnh đạo.

```text
                    SAOVN-OS
                       │
          ┌────────────┴────────────┐
          │                         │
   EXPERIENCE PLANE           CONTROL PLANE
   dùng chung toàn công ty    Admin / hậu phương
          │                         │
     Modules + UI             Policy / Identity /
                              Organization / Config
```

Không xây Admin Work và Member Work thành hai ứng dụng khác nhau. Cùng một module nghiệp vụ được dùng bởi mọi người; khác biệt nằm ở Identity → Membership → Role → Scope → Capability → UI. Frontend chỉ phản ánh capability. Firestore Rules/backend mới là lớp thực thi bảo mật cuối cùng.

## 3. Core Architecture

```text
CORE PLATFORM
├── Identity
├── Organization
│   ├── Company
│   ├── Department
│   ├── Team
│   └── Membership
├── Access Control
│   ├── Role
│   ├── Permission
│   ├── Scope
│   ├── Capability
│   └── Policy
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
    ├── Identity administration
    ├── Roles / capabilities
    ├── Organization configuration
    ├── Module enable/disable
    └── Runtime policy
```

## 4. Shared Experience Plane

```text
✓ Shared Application Shell
✓ Shared runtime bootstrap
✓ Canonical access contract
✓ Canonical capability vocabulary
✓ Canonical scope vocabulary
✓ Registry-driven navigation
✓ Registry-driven route guard
✓ Runtime policy loading
✓ Runtime policy realtime update
✓ Capability-driven UI
✓ Direct-route protection
✓ Module enable/disable enforcement
✓ Safe baseline when policy cannot be loaded
✓ Module dependency/readiness validation
```

Các trang nghiệp vụ không được tự tạo một hệ thống permission riêng nếu đã có contract ở Core.

## 5. Module Registry

File chính: `03_APPLICATION/WEB/js/core/module-registry.js`

Registry hiện quản lý Dashboard, Work, Departments, Members, Projects, Attendance, Chat và Notifications.

Mỗi module khai báo `id`, `version`, `label`, `dependencies`, `capabilities`, `routes`, `navigation`, `events`.

Registry có dependency validation, missing/disabled dependency detection, readiness state, `canLoadModule()`, `enabledModules()` và `moduleHealth()`.

Checkpoint: `347a55c7fd1aba3ee8cff78a2de31cb9a66bd2e8`.

## 6. Identity / Membership Contract

File: `03_APPLICATION/WEB/js/core/identity-context.js`.

Contract chuẩn hóa Identity/Membership/Organization/Department/Team/Role/Manager/Status thành context ổn định cho Experience Plane. Contract không cấp quyền; Policy/Capability Engine và backend/Rules vẫn là authority.

Checkpoint: `e161594845ac024a5f05bc54416a9b26f2fc4f3a`.

## 7. Organization / Scope Context

File: `03_APPLICATION/WEB/js/core/organization-context.js`.

Context chuẩn hóa company/organization, department, team, membership, role, title và trạng thái thành scope object dùng chung. Có `scopeMatches()` cho `SELF`, `PROJECT`, `TEAM`, `DEPARTMENT`, `COMPANY`. Đây là context/read model, không phải security boundary.

Checkpoint: `c348d5d1b9c9aa1248dd622563f6f5e215b4de04`.

## 8. Runtime Organization Integration — NEW

`policy-engine.js` đã tích hợp `createOrganizationContext()` trực tiếp vào `buildRuntimeContext()`.

Runtime context hiện có:

```text
Runtime
├── user
├── membership
├── organization
├── scope
├── policy
├── capabilities
├── can()
└── moduleEnabled()
```

Như vậy module nghiệp vụ có một nguồn context chuẩn thay vì tự đọc company/department/team/role theo nhiều format khác nhau.

Checkpoint: `d974098025895aa5f600dd6250961945bfde976e`.

## 9. Access Model

Vocabulary chuẩn: Role, Scope, Capability, Policy.

Scope mục tiêu: `SELF`, `PROJECT`, `TEAM`, `DEPARTMENT`, `COMPANY`, `GROUP`, `GLOBAL`.

Chức danh công ty không phải permission trực tiếp.

## 10. Control Plane

Admin Control Plane là khu vực hậu phương. Admin điều chỉnh runtime policy, module enabled/disabled, role capability policy và system configuration. Experience Plane đọc state này.

Admin không sửa JS/HTML frontend để điều khiển hệ thống. Admin sửa policy/configuration; frontend phản ánh policy/configuration.

## 11. Runtime Policy

Đã có canonical role normalization, deep merge policy với baseline, active policy runtime state, realtime policy update, capability re-resolution, safe unauthenticated state và safe baseline khi policy không tải được.

Luồng chuẩn:

```text
Firebase Auth
    ↓
Identity / Membership
    ↓
Organization Context
    ↓
Runtime Policy
    ↓
Capability Resolver
    ↓
Module Registry
    ↓
Navigation / Route Guard / UI
```

## 12. Organization / People

Các phần trước đã có Members management, Department management, Department Workspace, Team structure, Team assignment, Team Lead, Direct manager, Department scope, Team scope và legacy identity resolution.

Identity chính trong UI là Họ tên + Chức danh. Email/phone là thông tin liên hệ, không phải Identity chính.

## 13. Work — First Business Module

Đã có My Work, Tasks, Assignments, Deadlines, Progress, Kanban, Comments, Checklist, Activity, Mentions, Notifications foundation, Department/Team filtering, Member Work view và Admin Work management.

### Known issue — CHƯA CLOSED

`Member → assigned Work → Kanban status update` từng gặp `FirebaseError: Missing or insufficient permissions`.

Không đánh dấu Work security COMPLETE cho tới khi test bằng tài khoản Firebase thực tế và xác nhận Firestore Rules.

## 14. Communication / Notifications

Foundation đã có Conversations, Messages, Unread count, Notifications, Badge, Read/unread state, Mention notification và `@tất cả thành viên`.

## 15. Development Rules — LOCKED

```text
1. Một Experience Plane chung cho toàn công ty.
2. Admin là Control Plane hậu phương.
3. Không tách Admin UI và Member UI thành hai business application.
4. Không rải role/permission logic vào từng module nếu Core đã có contract.
5. Frontend không phải security boundary.
6. Firestore Rules/backend là security enforcement cuối cùng.
7. Admin thay đổi policy/configuration; frontend phản ánh runtime state.
8. Module phải khai báo dependency và contract.
9. Module disabled/dependency-disabled không được chạy nửa vời.
10. Không sửa module A bằng hack để chữa lỗi do contract của Core.
11. Mỗi checkpoint lớn phải có commit rõ ràng.
12. PROJECT_STATE được cập nhật theo checkpoint, không ghi vụn từng thay đổi.
13. Không gọi một phần nền tảng là COMPLETE nếu chưa kiểm chứng behavior thực tế.
14. Identity/Membership/Scope phải đi qua canonical context trước khi module nghiệp vụ sử dụng.
15. Organization Context chỉ là read/context layer; không được dùng thay Firestore security.
```

## 16. Next Development Sequence

```text
CURRENT
  ↓
Application Shell stabilization
  ↓
People / Organization module integration
  ↓
Communication module integration
  ↓
Work refactor onto canonical Scope + Capability
  ↓
Attendance / System Access
  ↓
Firestore Rules verification with real Admin + Member accounts
  ↓
End-to-end regression
  ↓
Release checkpoint
```

Work permission issue remains a known checkpoint and is not hidden.

# END OF PROJECT STATE
