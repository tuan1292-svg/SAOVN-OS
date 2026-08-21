# SAOVN-OS — PROJECT STATE

> Chốt sổ kỹ thuật: 21/08/2026 — Shared Experience Plane / Control Plane checkpoint

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

---

## 2. Current Product Direction — LOCKED

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

Không xây Admin Work và Member Work thành hai ứng dụng khác nhau.

Cùng một module nghiệp vụ được dùng bởi mọi người; khác biệt nằm ở:

```text
Identity → Membership → Role → Scope → Capability → UI
```

Frontend chỉ phản ánh capability. Firestore Rules/backend mới là lớp thực thi bảo mật cuối cùng.

Admin Control Plane thay đổi policy/configuration; Experience Plane đọc runtime state và tự thích nghi.

---

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

---

## 4. Shared Experience Plane

Đã triển khai nền tảng dùng chung:

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
```

Các trang nghiệp vụ không được tự tạo một hệ thống permission riêng nếu đã có contract ở Core.

---

## 5. Module Registry

File chính:

```text
03_APPLICATION/WEB/js/core/module-registry.js
```

Registry hiện quản lý các module:

```text
Dashboard
Work
Departments
Members
Projects
Attendance
Chat
Notifications
```

Mỗi module khai báo:

```text
id
version
label
dependencies
capabilities
routes
navigation
events
```

Registry hiện có:

```text
✓ Dependency validation
✓ Missing dependency detection
✓ Disabled dependency detection
✓ Module readiness state
✓ canLoadModule()
✓ enabledModules()
✓ moduleHealth()
```

Mục tiêu: module bị Admin tắt hoặc thiếu dependency không được chạy nửa vời và gây lỗi dây chuyền.

Checkpoint commit:

```text
347a55c7fd1aba3ee8cff78a2de31cb9a66bd2e8
```

---

## 6. Access Model

Vocabulary chuẩn:

```text
Role
Scope
Capability
Policy
```

Scope mục tiêu:

```text
SELF
PROJECT
TEAM
DEPARTMENT
COMPANY
GROUP
GLOBAL
```

Không dùng chức danh công ty làm permission trực tiếp.

Ví dụ:

```text
Chức danh:
Founder · Chairman · CEO
Department Head
Team Lead
Specialist
Staff

≠

System Role:
ADMIN
MANAGER
MEMBER
```

Role có thể được mở rộng sau này mà không phải viết lại module nghiệp vụ.

---

## 7. Control Plane

Admin Control Plane là khu vực hậu phương.

Admin điều chỉnh:

```text
✓ Runtime policy
✓ Module enabled / disabled
✓ Role capability policy
✓ System configuration
```

Experience Plane đọc state này.

Nguyên tắc:

```text
Admin không sửa JS/HTML của frontend để điều khiển hệ thống.
Admin sửa policy/configuration.
Frontend phản ánh policy/configuration.
```

Admin Control không xuất hiện với user thông thường và route được bảo vệ bằng capability quản trị hệ thống.

---

## 8. Runtime Policy

Runtime policy đã được đưa về một nguồn resolve chung.

Đã có:

```text
✓ Canonical role normalization
✓ Deep merge policy với baseline
✓ activePolicy runtime state
✓ Realtime policy update
✓ Capability re-resolution khi policy thay đổi
✓ Không cấp quyền mặc định cho unauthenticated user
✓ Safe baseline khi policy không tải được
```

Luồng:

```text
Firebase Auth
    ↓
Identity / Membership
    ↓
Runtime Policy
    ↓
Capability Resolver
    ↓
Module Registry
    ↓
Navigation / Route Guard / UI
```

---

## 9. Organization / Identity

Các phần đã có từ checkpoint trước:

```text
✓ Members management
✓ Department management
✓ Department Workspace
✓ Team structure
✓ Team assignment
✓ Team Lead
✓ Direct manager
✓ Department scope
✓ Team scope
✓ Legacy identity resolution
```

Identity chính trong UI:

```text
Nguyễn Anh Tuấn
Founder · Chairman · CEO
```

Email/phone là thông tin liên hệ, không phải Identity chính.

---

## 10. Work — First Business Module

Work vẫn là Business Module đầu tiên.

Đã có:

```text
✓ My Work
✓ Tasks
✓ Assignments
✓ Deadlines
✓ Progress
✓ Kanban
✓ Comments
✓ Checklist
✓ Activity
✓ Mentions
✓ Notifications foundation
✓ Department / Team filtering
✓ Member Work view
✓ Admin Work management
```

### Known issue — CHƯA CLOSED

```text
Member → assigned Work → Kanban status update
```

Từng gặp:

```text
FirebaseError: Missing or insufficient permissions.
```

Không đánh dấu Work security COMPLETE cho tới khi test bằng tài khoản Firebase thực tế và xác nhận Firestore Rules.

Không rollback UI/module đã hoàn thiện chỉ vì lỗi permission Work.

---

## 11. Communication / Notifications

Foundation đã có:

```text
✓ Conversations
✓ Messages
✓ Unread count
✓ Notifications
✓ Badge
✓ Read / unread state
✓ Mention notification
✓ @tất cả thành viên
```

Các lỗi indexing / permission / unread trước đó phải được giữ nguyên behavior khi refactor.

---

## 12. Current Code Checkpoints

Các checkpoint kiến trúc mới nhất trên `main`:

```text
347a55c7  feat(core): add module dependency validation and readiness checks
```

Các checkpoint trước đó gồm shared shell, policy engine, canonical access contract, navigation/route guard, Control Plane và runtime policy realtime.

GitHub `main` là Source of Truth.

---

## 13. Development Rules — LOCKED

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
```

---

## 14. Next Development Sequence

```text
CURRENT
  ↓
Identity / Membership / Organization / Scope contract
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

---

# END OF PROJECT STATE
