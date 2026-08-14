# SAOVN-OS — PROJECT STATE

> Chốt sổ: 14/08/2026

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

---

## 2. Core Architecture

Kiến trúc nền tảng đã xác lập:

```text
SAOVN-OS
│
├── CORE PLATFORM
│   ├── Identity
│   ├── Organization
│   │   ├── Company
│   │   ├── Department
│   │   ├── Team
│   │   └── Membership
│   └── Access Control
│       ├── Role
│       ├── Permission
│       ├── Scope
│       └── Policy
│
└── BUSINESS MODULES
    └── WORK
```

Architecture / Constitution / Domain Model / Module Map / System Architecture / Permission Model / Data Model / Integration Architecture / Technical Architecture / Architecture Decisions / Module Specification đã được xác lập trong `00_CONSTITUTION/`, `01_ARCHITECTURE/` và `DOCS/`.

---

## 3. Product Rules Already Agreed

```text
- Làm từng checkpoint cho xong rồi mới chuyển bước.
- Không vá UI bằng JavaScript nếu có thể sửa HTML/CSS đúng chỗ.
- Ưu tiên giao diện sạch, gọn, hiển thị thông tin hữu ích.
- Identity chính = Họ tên + Chức danh.
- Không dùng email/username thay cho tên nếu Identity đã có họ tên.
- Email và số điện thoại là thông tin liên hệ/tra cứu.
- Thông tin liên hệ chi tiết không chiếm chỗ trong Work UI.
- Members và Department management là khu vực Admin.
- Public self-registration mặc định OFF.
- Tài khoản Founder/Admin hiển thị `Founder · Chairman · CEO`.
- PROJECT_STATE được chốt theo checkpoint, không cập nhật vụn từng bước.
```

---

## 4. Completed Foundation

```text
ARCHITECTURE FOUNDATION       COMPLETE
IDENTITY / LOGIN              COMPLETE FOR CURRENT PROTOTYPE
PERMISSION NAVIGATION         COMPLETE FOR CURRENT PROTOTYPE
MEMBERS MANAGEMENT            COMPLETE
MEMBER IDENTITY DISPLAY       COMPLETE
MEMBER CONTACT FIELD          COMPLETE
DEPARTMENT MASTER             COMPLETE
DEPARTMENT MANAGEMENT         COMPLETE
DEPARTMENT UI POLISH          COMPLETE
DEPARTMENT WORKSPACE          COMPLETE
TEAM STRUCTURE                COMPLETE
TEAM ASSIGNMENT               COMPLETE
TEAM → WORK FILTER            COMPLETE
MANAGEMENT SCOPE RECOGNITION  COMPLETE
```

---

## 5. Identity Display

Trong màn hình làm việc, Identity phải hiển thị dạng:

```text
Nguyễn Anh Tuấn
Founder · Chairman · CEO
```

Legacy values như `tuan1292` phải được resolve về Identity khi có thể.

Work comments, assignees, member roster và Department Workspace đều ưu tiên Identity hiện tại.

---

## 6. Members

Members là khu vực quản trị.

Đã có:

```text
✓ Admin-only management
✓ Họ tên + chức danh
✓ Role
✓ Status
✓ Department assignment
✓ Team assignment
✓ Team Lead indicator
✓ Direct manager field
✓ Phone/contact field
✓ Email contact field
✓ Legacy identity resolution
```

Email / phone vẫn tồn tại để phục vụ tra cứu liên hệ, nhưng không được dùng làm Identity chính.

### Ghi chú bảo mật

Cần tiếp tục hoàn thiện data visibility để thông tin liên hệ chi tiết chỉ xuất hiện trong khu vực phù hợp, thay vì đưa email/phone vào các màn hình làm việc chung.

---

## 7. Department

Collection:

```text
/departments
```

Trường chính:

```text
name
code
description
headId
active
createdAt
createdBy
updatedAt
updatedBy
```

Department management đã có:

```text
✓ List
✓ Search
✓ Status filter
✓ Statistics
✓ Create
✓ Edit
✓ Department Head
✓ Active / Inactive
✓ Member count
✓ Unassigned count
✓ Member department selector
✓ UI polish
✓ Admin-only management
```

---

## 8. Department Workspace

Trang:

```text
03_APPLICATION/WEB/department-workspace.html
```

Workspace hiện có:

```text
✓ Department identity
✓ Department status
✓ Member roster
✓ Họ tên + chức danh
✓ Work statistics
✓ Department task list
✓ Team structure
✓ Team Lead display
✓ Team-based Work filtering
✓ Management scope display
✓ Task overflow / responsive panel fix
```

Task dài không được phép tràn khỏi panel.

---

## 9. Team

Team là tầng tổ chức bên trong Department:

```text
Department
│
├── Team A
│   ├── Team Lead
│   └── Members
│
├── Team B
│   ├── Team Lead
│   └── Members
│
└── Chưa phân nhóm
```

Đã có:

```text
✓ Team assignment
✓ Persist team assignment
✓ Team grouping
✓ Team Lead identification
✓ Team → Work filter
✓ Team field UI polish
```

Team CRUD độc lập chưa được coi là hoàn thành.

---

## 10. Management Scope

Scope model mục tiêu:

```text
Founder · Chairman · CEO
        ↓
TOÀN HỆ THỐNG

Department Head
        ↓
PHÒNG BAN

Team Lead
        ↓
TEAM

Member
        ↓
CÁ NHÂN / CÔNG VIỆC ĐƯỢC GIAO
```

Workspace đã nhận diện scope. Work security vẫn phải được xác nhận bằng Firestore Rules và test tài khoản thực tế.

---

## 11. WORK — First Business Module

WORK là Business Module đầu tiên.

Mục tiêu:

```text
My Work
Tasks
Projects
Assignments
Deadlines
Progress
Status
Comments
Attachments
Notifications
Reports
```

Work Identity luôn dùng Họ tên + Chức danh.

Legacy assignee identity đã được xử lý.

Department / Team scope đã được nối vào Work ở mức prototype và Rules, nhưng cần test/deploy thực tế trước khi coi security checkpoint hoàn thành.

---

## 12. Known Recent Fixes

```text
c9b8b11  fix: prevent department workspace task overflow
941ca84  feat: enforce department head work scope
fab358b  fix: resolve department head and team lead scope
43c12b9  fix: align department workspace tasks with scope
1442162  fix: allow members directory reads without admin permission
52c3b31  fix: polish member team field and detail inputs
```

Các commit trên repo là Source of Truth; nếu local khác repo thì pull `main` trước khi làm tiếp.

---

## 13. Current Checkpoint

### COMPLETE

```text
Identity
Members
Member identity display
Member contact foundation
Departments
Department management
Department UI
Department Workspace
Team structure
Team assignment
Team Work filtering
Management scope recognition
Member access fix for directory reads
Team field UI polish
Department Workspace task overflow fix
```

### NOT YET CLOSED AS PRODUCTION SECURITY

```text
Scope → Work Security
Department Head → Work scope
Team Lead → Work scope
Member → personal / assigned scope
Firestore Rules verification
```

Không đánh dấu các mục này COMPLETE chỉ vì code đã commit.

---

## 14. NEXT DEVELOPMENT — Notifications + Chat

Sau khi Scope → Work security được xác nhận, chuyển sang hai năng lực người dùng yêu cầu:

### A. Notifications

Mục tiêu:

```text
Notification Center
├── Việc mới được giao
├── Thay đổi trạng thái công việc
├── Bình luận / trao đổi mới
├── Mention
├── Deadline sắp tới
└── Thông báo hệ thống
```

Nguyên tắc:

```text
- Không spam.
- Notification phải gắn với Actor / Recipient / Entity.
- Có trạng thái read/unread.
- Có timestamp.
- Click notification phải đưa tới đúng ngữ cảnh.
- Identity hiển thị bằng Họ tên + Chức danh.
```

### B. Chat / Trao đổi nội bộ

Chat là năng lực Core/Communication dùng chung, không trộn với comment của một Task.

Mục tiêu ban đầu:

```text
CHAT
├── Conversations
│   ├── Direct message
│   └── Group conversation
│
├── Messages
│   ├── Sender identity
│   ├── Content
│   ├── Timestamp
│   └── Read state
│
└── Presence / Activity
```

Giai đoạn đầu ưu tiên:

```text
1. Danh sách cuộc trò chuyện
2. Chat 1-1
3. Chat nhóm
4. Gửi / nhận message realtime
5. Unread count
6. Notification integration
7. Identity = Họ tên + Chức danh
```

Không dùng email làm tên người gửi trong giao diện chat nếu Identity đã có họ tên.

---

## 15. Development Sequence From Here

```text
CURRENT
  ↓
1. Verify / finish Scope → Work Security
  ↓
2. Department Head Work scope
  ↓
3. Team Lead Work scope
  ↓
4. Member personal / assigned scope
  ↓
5. Firestore Rules verification
  ↓
6. Notifications Core
  ↓
7. Notification Center UI
  ↓
8. Chat data model
  ↓
9. Chat 1-1
  ↓
10. Chat group
  ↓
11. Realtime message updates
  ↓
12. Unread + Notification integration
  ↓
13. Team management CRUD
  ↓
14. Reports / Activity
```

Không quay lại sửa các phần đã chốt trừ khi phát hiện lỗi thực tế.

---

## 16. Next Session Command

```powershell
cd C:\Users\Admin\Desktop\SAOVN-OS
git pull origin main
git status
git log -3 --oneline
```

Nếu Rules đã thay đổi nhưng chưa deploy:

```powershell
firebase deploy --only firestore:rules
```

---

# END OF PROJECT STATE
