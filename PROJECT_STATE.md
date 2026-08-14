# SAOVN-OS — PROJECT STATE

## 1. Project Identity

**Project:** SAOVN-OS

**Organization:** SAOVN

**Definition:**

SAOVN-OS là một **môi trường làm việc online cho tập đoàn SAOVN**, được xây dựng như một Organizational Operating System.

SAOVN-OS không chỉ là một ứng dụng đơn lẻ.

Nó là nền tảng thống nhất để tổ chức, con người, dữ liệu, công việc, ứng dụng nghiệp vụ, tích hợp và AI cùng hoạt động trong một hệ sinh thái chung.

---

# 2. Current Mission

Mục tiêu là xây dựng một môi trường làm việc online thống nhất cho SAOVN, trong đó:

* Nhân sự có Identity thống nhất.
* Công ty và tổ chức được quản lý tập trung.
* Quyền truy cập được kiểm soát.
* Công việc được giao và theo dõi trong một hệ thống chung.
* Các Business Module dùng chung Core Platform.
* Dữ liệu có Ownership và Boundary rõ ràng.
* AI có thể được tích hợp nhưng không làm mất tính độc lập của hệ thống cốt lõi.

---

# 3. Current Project Phase

**Current Phase: Core Foundation → Organization / Department / Team → WORK Integration**

Trạng thái:

```text
Vision                       ✓
Constitution                 ✓
Architecture Foundation     ✓
Technical Architecture      ✓
Architecture Decisions      ✓
Module Specification        ✓

Identity / Login Prototype  ✓
Permission Prototype        ✓
Members Management          ✓
Department Management       ✓
Department Workspace        ✓
Team Structure               ✓
Team Assignment              ✓
Team → Work Filter           ✓
Management Scope Prototype   ✓

Scope → Work Security        NEXT
```

---

# 4. Repository Structure

```text
SAOVN-OS/
│
├── .gitignore
├── 00_CONSTITUTION/
├── 01_ARCHITECTURE/
├── DOCS/
├── 03_APPLICATION/
│   └── WEB/
├── PROJECT_STATE.md
└── START_HERE.md
```

---

# 5. Architecture Completed

## Vision

`DOCS/VISION/SAOVN-OS.md`

SAOVN-OS được xác định là môi trường làm việc online và nền tảng vận hành thống nhất cho SAOVN.

## Constitution

`00_CONSTITUTION/`

Chứa các nguyên tắc nền tảng và quy tắc xây dựng hệ thống.

## Domain Model

`01_ARCHITECTURE/DOMAIN_MODEL.md`

Định nghĩa các Domain nghiệp vụ và ranh giới nghiệp vụ.

## Module Map

`01_ARCHITECTURE/MODULE_MAP.md`

Định nghĩa các nhóm Module và quan hệ giữa chúng.

## System Architecture

`01_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`

Định nghĩa kiến trúc hệ thống tổng thể.

## Permission Model

`01_ARCHITECTURE/PERMISSION_MODEL.md`

Định nghĩa Identity, Organization, Role, Permission, Scope và Policy.

## Data Model

`01_ARCHITECTURE/DATA_MODEL.md`

Định nghĩa cách dữ liệu được tổ chức, sở hữu và liên kết.

## Integration Architecture

`01_ARCHITECTURE/INTEGRATION_ARCHITECTURE.md`

Định nghĩa API, Event, Webhook, Adapter và các Integration Boundary.

## Technical Architecture

`01_ARCHITECTURE/TECHNICAL_ARCHITECTURE.md`

Định nghĩa kiến trúc kỹ thuật tổng thể.

## Architecture Decisions

`01_ARCHITECTURE/ARCHITECTURE_DECISIONS.md`

Đã xác lập các nguyên tắc và quyết định kiến trúc quan trọng như:

* SAOVN-OS là Organizational Operating System.
* Core Platform + Applications.
* Shared Identity.
* Central Permission Model.
* Domain Ownership.
* API Integration Boundary.
* Event Driven cho Async Work.
* AI là Optional Layer.
* Provider Independence.
* Source of Truth.
* Git Repository là Project Source of Truth.
* Documentation trước Implementation.
* Incremental Architecture.
* Security by Default.
* Organization Boundary.
* Web First.
* Architecture over Framework.
* Decision Reversibility.
* Không Microservices hóa quá sớm.
* Architecture Documentation là Living System.

## Module Specification

`01_ARCHITECTURE/MODULE_SPECIFICATION.md`

Định nghĩa tiêu chuẩn thiết kế Module trước khi triển khai.

---

# 6. What Core Means in SAOVN-OS

**Core Platform** là phần nền tảng dùng chung cho toàn bộ SAOVN-OS.

Core không phải là một Business Application riêng.

Core cung cấp các năng lực mà nhiều Module khác cần dùng chung.

```text
SAOVN-OS
│
├── CORE PLATFORM
│   ├── Identity
│   ├── Organization
│   └── Access Control
│
└── BUSINESS MODULES
    ├── WORK
    ├── HR
    └── CRM
```

---

# 7. Core Foundation

Core Foundation bao gồm các năng lực nền tảng:

```text
CORE
│
├── Identity
│   ├── User
│   ├── Account
│   ├── Login
│   └── Session
│
├── Organization
│   ├── Company
│   ├── Department
│   ├── Team
│   └── Membership
│
└── Access Control
    ├── Role
    ├── Permission
    ├── Scope
    └── Policy
```

Prototype hiện tại đã đưa Identity, Organization và Permission vào web application ở mức sử dụng thực tế.

---

# 8. Identity and Login

Login được xem là **cổng vào SAOVN-OS**.

Luồng:

```text
User
 ↓
Login
 ↓
Authentication
 ↓
Identity
 ↓
Session
 ↓
SAOVN-OS
```

Authentication và Authorization được tách biệt.

```text
Authentication
= Người này là ai?

Authorization
= Người này được phép làm gì?
```

Public Self-Registration mặc định OFF.

---

# 9. Identity Display Rule

Identity hiển thị chính trong giao diện làm việc là:

```text
Họ và tên
Chức danh
```

Ví dụ:

```text
Nguyễn Anh Tuấn
Founder · Chairman · CEO
```

Không dùng email hoặc username làm tên hiển thị nếu Identity đã có họ tên.

Email và số điện thoại chỉ dùng như thông tin liên hệ/tra cứu, không chiếm chỗ của Identity trong Work UI.

Legacy identifiers được resolve về Identity hiện tại khi có thể.

---

# 10. Organization Model

Identity tồn tại trong Organization Context thông qua Membership.

```text
Identity
   ↓
Membership
   ↓
Organization
   ↓
Department
   ↓
Team
   ↓
Role / Permission / Scope
```

Department hiện được lưu trong collection:

```text
/departments
```

Các trường chính:

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

Identity có thể liên kết với Department bằng:

```text
departmentId
```

Dữ liệu `department` cũ vẫn được hỗ trợ trong giai đoạn chuyển đổi.

---

# 11. Members Management

Members là khu vực quản trị.

Đã hoàn thành:

```text
✓ Admin-only Members navigation
✓ Identity-based display
✓ Họ tên + chức danh
✓ Phone/contact field
✓ Email giữ cho liên hệ
✓ Department assignment
✓ Team assignment
✓ Team Lead / Trưởng nhóm indicator
✓ Legacy identity resolution
```

Tài khoản Admin hiện được hiển thị theo chức danh:

```text
Founder · Chairman · CEO
```

---

# 12. Department Management

Trang:

```text
03_APPLICATION/WEB/departments.html
```

Đã hoàn thành:

```text
✓ Department list
✓ Search
✓ Status filter
✓ Statistics
✓ Create department
✓ Edit department
✓ Department head
✓ Active / Inactive
✓ Member count
✓ Unassigned member count
✓ Department selector
✓ UI polish
✓ Admin-only management
```

Quyền quản lý Department hiện dùng permission quản trị phù hợp.

---

# 13. Department Workspace

Department đã được chuyển từ danh mục quản trị thành **không gian làm việc**.

Trang:

```text
03_APPLICATION/WEB/department-workspace.html
```

Nền tảng hiện có:

```text
✓ Department identity
✓ Department status
✓ Member roster
✓ Họ tên + chức danh
✓ Phone / email contact shortcuts
✓ Work statistics
✓ Department-related task list
✓ Team structure
✓ Team Lead display
✓ Team-based Work filtering
✓ Management scope display
```

Work được liên kết với thành viên thông qua `assigneeIds`, tránh phá cấu trúc Work hiện tại.

---

# 14. Team Structure

Team hiện là tầng tổ chức bên trong Department.

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
└── Unassigned Team
```

Đã hoàn thành:

```text
✓ Team assignment trong Members
✓ Persist team assignment
✓ Team Lead identification
✓ Team grouping trong Department Workspace
✓ Team → Work filter
```

Team management CRUD độc lập chưa được coi là checkpoint hoàn thành; hiện Team được quản lý thông qua thông tin tổ chức của thành viên.

---

# 15. Management Scope Prototype

Workspace hiện đã nhận diện phạm vi tổ chức của người đăng nhập:

```text
Founder · Chairman · CEO
        ↓
Toàn hệ thống

Department Head
        ↓
Phạm vi phòng ban

Team Lead
        ↓
Phạm vi Team

Member
        ↓
Phạm vi cá nhân
```

Hiện tại đây là **scope recognition / UI prototype**.

Scope chưa được coi là hoàn thành về mặt Work security cho đến khi Firestore query/rules thực sự giới hạn dữ liệu theo scope.

---

# 16. First Business Module — WORK

Business Module đầu tiên được xác định là:

> **WORK**

Mục tiêu:

* Nhận việc.
* Giao việc.
* Theo dõi công việc.
* Theo dõi tiến độ.
* Quản lý Deadline.
* Quản lý Project.
* Trao đổi trong công việc.
* Đính kèm tài liệu.
* Theo dõi trạng thái.
* Xem báo cáo công việc.

Khái niệm:

```text
WORK
│
├── My Work
├── Tasks
├── Projects
├── Assignments
├── Deadlines
├── Progress
├── Status
├── Comments
├── Attachments
├── Notifications
└── Reports
```

---

# 17. Work Identity Rule

Trong Work UI:

```text
Nguyễn Anh Tuấn
Founder · Chairman · CEO
```

không được rơi về:

```text
email@example.com
```

nếu Identity đã có họ tên.

Các lỗi legacy assignee identity đã được xử lý ở các checkpoint trước.

---

# 18. Permission / Access Status

Đã có prototype cho:

```text
✓ Permission-aware navigation
✓ Admin-only Members
✓ Admin-only Department management
✓ Work visibility rules
✓ Department workspace access
✓ Organization scope recognition
```

Mục còn lại cần hoàn thiện:

```text
Scope → Work security
Department Head → Work scope
Team Lead → Work scope
Member → personal / assigned scope
```

Đây là checkpoint bảo mật kế tiếp, không chỉ là UI.

---

# 19. Current Git Checkpoint

Các checkpoint gần nhất của chuỗi phát triển Department / Team / Scope:

```text
8147b7b  fix: polish departments page controls and layout
97b3790  fix: polish member contact field styling
9a40c2c  fix: polish department layout and controls
10978c4  feat: add department workspace page
c8092f5  feat: style department workspace
85e27f4  feat: load department workspace data
16a90b5  feat: connect departments to workspaces
b0050a5  fix: polish department workspace entry
0fdb727  feat: add team assignment to member organization editor
5d9440d  feat: persist member team assignment
512c8c0  feat: show team leads in department workspace
117239a  feat: add team filter to department work
4ad3eb4  feat: filter department work by team
249322a  fix: style team work filter
1d48456  feat: connect department workspace to management scope
```

Repository:

```text
https://github.com/tuan1292-svg/SAOVN-OS.git
```

Local directory:

```text
C:\Users\Admin\Desktop\SAOVN-OS
```

---

# 20. Current Checkpoint

```text
ARCHITECTURE FOUNDATION       COMPLETE
IDENTITY DISPLAY              COMPLETE
MEMBERS MANAGEMENT            COMPLETE
MEMBER CONTACT                COMPLETE
DEPARTMENT MASTER             COMPLETE
DEPARTMENT MANAGEMENT         COMPLETE
DEPARTMENT UI POLISH          COMPLETE
DEPARTMENT WORKSPACE          COMPLETE
TEAM STRUCTURE                COMPLETE
TEAM ASSIGNMENT               COMPLETE
TEAM → WORK FILTER            COMPLETE
MANAGEMENT SCOPE RECOGNITION  COMPLETE

SCOPE → WORK SECURITY         NEXT
```

---

# 21. Next Development Sequence

Tiếp tục từ Scope → Work, không quay lại sửa các phần đã chốt trừ khi phát hiện lỗi thực tế.

```text
1. Scope → Work security
       ↓
2. Department Head Work scope
       ↓
3. Team Lead Work scope
       ↓
4. Member personal / assigned scope
       ↓
5. Firestore Rules verification
       ↓
6. Department-level Work views
       ↓
7. Team management CRUD
       ↓
8. Notifications / activity
       ↓
9. Reports
```

---

# 22. Product Direction

Mô hình tổ chức mục tiêu:

```text
SAOVN Organization
        │
        ├── Department
        │     ├── Department Head
        │     ├── Teams
        │     │    ├── Team Lead
        │     │    └── Members
        │     └── Workspace
        │
        └── Shared Core
              ├── Identity
              ├── Organization
              └── Access Control
```

Department Workspace là cầu nối giữa **Organization Core** và **WORK**.

---

# 23. Working Protocol

Quy trình làm việc:

```text
1. Xác định thứ cần xây.
2. Tập trung hoàn thành một checkpoint.
3. Ưu tiên sửa đúng HTML/CSS thay vì vá UI bằng JS.
4. Identity hiển thị bằng họ tên + chức danh.
5. Email/phone dành cho tra cứu liên hệ.
6. Git commit + push.
7. Kiểm tra trạng thái.
8. Chuyển checkpoint kế tiếp.
9. Khi User nói "chốt sổ": cập nhật PROJECT_STATE.md.
```

Không cập nhật Project State sau từng bước nhỏ.

---

# 24. Next Session Rule

Khi tiếp tục:

```powershell
cd C:\Users\Admin\Desktop\SAOVN-OS
git pull origin main
git status
git log -3 --oneline
```

Sau đó tiếp tục trực tiếp từ:

```text
SCOPE → WORK SECURITY
```

Không xây lại Members, Department Master, Team Assignment hoặc Department Workspace đã hoàn thành trừ khi kiểm tra thực tế phát hiện lỗi.

---

# 25. Final State

```text
SAOVN-OS

VISION                    COMPLETE
CONSTITUTION              COMPLETE
DOMAIN MODEL              COMPLETE
MODULE MAP                COMPLETE
SYSTEM ARCHITECTURE       COMPLETE
PERMISSION MODEL          COMPLETE
DATA MODEL                COMPLETE
INTEGRATION ARCHITECTURE  COMPLETE
TECHNICAL ARCHITECTURE    COMPLETE
ARCHITECTURE DECISIONS    COMPLETE
MODULE SPECIFICATION      COMPLETE

IDENTITY / LOGIN PROTOTYPE       COMPLETE
MEMBERS MANAGEMENT               COMPLETE
DEPARTMENT MANAGEMENT            COMPLETE
DEPARTMENT WORKSPACE             COMPLETE
TEAM STRUCTURE                   COMPLETE
TEAM ASSIGNMENT                  COMPLETE
TEAM → WORK FILTER               COMPLETE
MANAGEMENT SCOPE RECOGNITION     COMPLETE

SCOPE → WORK SECURITY            NEXT

FIRST BUSINESS MODULE:
WORK                              SELECTED / IN PROGRESS
```

---

# 26. Final Project Statement

SAOVN-OS đang được xây dựng như một **môi trường làm việc online thống nhất cho tập đoàn SAOVN**.

Core Foundation cung cấp Identity, Organization và Access Control.

Login là cổng vào hệ thống.

Tài khoản không mặc định được tạo bằng Public Self-Registration; Organization là chủ thể cấp, mời hoặc Provision Account.

Organization hiện đã được triển khai thành Department và Team trong web prototype.

WORK là Business Module đầu tiên, và Department Workspace đã bắt đầu trở thành không gian làm việc thực tế cho thành viên.

Điểm tiếp theo là biến Management Scope thành **Work Security thực sự**, để Department Head, Team Lead và Member chỉ nhìn thấy/phối hợp với đúng phạm vi công việc của mình.
