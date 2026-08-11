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

**Current Phase: Architecture Foundation → Core Foundation Definition**

Trạng thái:

```text
Vision                 ✓
Constitution           ✓
Architecture Foundation ✓
Technical Architecture ✓
Architecture Decisions ✓
Module Specification   ✓

Core Foundation        NEXT
First Business Module  WORK
Implementation         NOT STARTED
```

---

# 4. Repository Structure

```text
SAOVN-OS/
│
├── .gitignore
│
├── 00_CONSTITUTION/
│   ├── AI_BUILD_RULES.md
│   └── MASTER_BLUEPRINT.md
│
├── 01_ARCHITECTURE/
│   ├── DOMAIN_MODEL.md
│   ├── MODULE_MAP.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── PERMISSION_MODEL.md
│   ├── DATA_MODEL.md
│   ├── INTEGRATION_ARCHITECTURE.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── ARCHITECTURE_DECISIONS.md
│   └── MODULE_SPECIFICATION.md
│
├── DOCS/
│   └── VISION/
│       └── SAOVN-OS.md
│
├── PROJECT_STATE.md
│
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

Định nghĩa kiến trúc kỹ thuật tổng thể:

```text
Web Client
API / Gateway
Application Layer
Core Services
Domain Layer
Data Layer
Database
Cache
Storage
Search
Queue
Workers
Authentication
Authorization
Security
Observability
Infrastructure
AI Layer
```

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

Mô hình:

```text
                    SAOVN-OS
                       │
          ┌────────────┴────────────┐
          │                         │
      CORE PLATFORM            BUSINESS MODULES
          │                         │
    ┌─────┼─────┐             ┌─────┼─────┐
    │     │     │             │     │     │
 Identity Org  Access        Work   HR   CRM
```

---

# 7. Core Foundation

Core Foundation dự kiến bao gồm các thành phần:

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
│   └── Membership
│
└── Access Control
    ├── Role
    ├── Permission
    ├── Scope
    └── Policy
```

Đây là nhóm nền tảng cần được làm rõ trước khi triển khai Business Module đầu tiên.

---

# 8. Identity and Login

Login được xem là **cổng vào SAOVN-OS**.

Luồng cơ bản:

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

Login thuộc Core Foundation, không phải Business Module.

Authentication và Authorization phải được tách biệt.

```text
Authentication
= Người này là ai?

Authorization
= Người này được phép làm gì?
```

---

# 9. Account Provisioning

SAOVN-OS được định hướng là môi trường doanh nghiệp nội bộ.

Do đó **Public Self-Registration mặc định OFF**.

Không sử dụng mô hình:

```text
User
 ↓
Register
 ↓
Tự tạo thành viên
```

Mô hình ưu tiên:

```text
Organization
 ↓
Provision / Invite Account
 ↓
Activation
 ↓
Login
 ↓
SAOVN-OS
```

Các phương thức Provisioning có thể được hỗ trợ:

```text
Company Created Account
Invitation
Admin Provisioning
SSO
External Identity
```

Cơ chế cụ thể sẽ được thiết kế trong Core Identity.

---

# 10. Organization Model

Identity không tồn tại độc lập với Organization Context.

Mô hình khái niệm:

```text
Identity
   ↓
Membership
   ↓
Organization
   ↓
Department
   ↓
Role / Permission
```

Một User có thể có Membership trong một hoặc nhiều Organization nếu Architecture và Business Rules cho phép.

Quyền truy cập phải được xác định theo Scope phù hợp.

---

# 11. First Business Module — WORK

Business Module đầu tiên được xác định là:

> **WORK**

WORK là môi trường làm việc trực tuyến cốt lõi của SAOVN-OS.

Mục tiêu là giúp nhân sự:

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

Khái niệm ban đầu:

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

WORK là **Business Module đầu tiên**, trong khi Identity/Login là Core Foundation.

---

# 12. First User Journey

Luồng sống đầu tiên của SAOVN-OS được hình dung:

```text
Organization
      ↓
Account Provisioning
      ↓
Login
      ↓
Identity
      ↓
Organization / Department
      ↓
Role / Permission
      ↓
WORK
      ↓
Receive / Create Work
      ↓
Execute
      ↓
Update Progress
      ↓
Complete
      ↓
Report / Audit
```

Đây là luồng nghiệp vụ đầu tiên cần được biến thành hệ thống thực tế.

---

# 13. Current Architectural Model

```text
                         SAOVN-OS
                            │
                 ┌──────────┴──────────┐
                 │                     │
              CORE                  WORK
                 │                     │
       ┌─────────┼─────────┐     ┌────┼────┐
       │         │         │     │    │    │
    Identity Organization Access Task Project Progress
       │         │         │
     Login     Company   Permission
     Session   Dept      Role
     Account   Member
```

Technical flow:

```text
User
 ↓
Web Client
 ↓
API / Gateway
 ↓
Core / Application
 ↓
Domain
 ↓
Data Access
 ↓
Database / Cache / Storage
 ↓
Event / Queue / Workers
 ↓
External Systems
```

---

# 14. What Has NOT Been Built Yet

Tại thời điểm này:

```text
Production Login          NOT BUILT
Identity System           NOT BUILT
Organization System       NOT BUILT
Permission Engine         NOT BUILT
WORK Module               NOT BUILT
Production Backend        NOT BUILT
Production Database       NOT BUILT
Production API            NOT BUILT
Production AI Agent       NOT BUILT
Deployment Infrastructure NOT BUILT
```

Các phần trên mới đang ở mức Architecture / Planning.

---

# 15. Next Development Sequence

Thứ tự dự kiến:

```text
1. Core Identity
       ↓
2. Account / Login / Session
       ↓
3. Organization / Department / Membership
       ↓
4. Role / Permission / Policy
       ↓
5. WORK Module Specification
       ↓
6. WORK Data Design
       ↓
7. WORK API Design
       ↓
8. WORK Workflow Design
       ↓
9. WORK UI Design
       ↓
10. Technical Design
       ↓
11. Implementation
       ↓
12. Testing
       ↓
13. Deployment
```

Thứ tự này có thể thay đổi nếu phát hiện Dependency mới trong quá trình thiết kế.

---

# 16. Important Architectural Distinction

SAOVN-OS hiện được chia thành hai lớp khái niệm quan trọng:

```text
CORE
= Nền tảng dùng chung

WORK
= Business Module đầu tiên
```

Không nhầm:

```text
Login ≠ Business Module

Core ≠ Work

Authentication ≠ Authorization
```

---

# 17. Working Protocol

Quy trình làm việc:

```text
1. Xác định thứ cần xây.
2. Giới thiệu ngắn gọn mục đích.
3. Đưa nguyên khối nội dung hoàn chỉnh.
4. User copy vào đúng vị trí.
5. Git commit + push.
6. User báo "đã up".
7. Kiểm tra trạng thái.
8. Tiếp tục.
9. Khi User nói "chốt sổ":
   → cập nhật PROJECT_STATE.md một lần.
```

Không cập nhật Project State sau từng bước nhỏ.

Không lặp lại các giải thích đã được xác lập.

Không tạo file Markdown chỉ để tạo tài liệu nếu nó không phục vụ một quyết định hoặc bước xây dựng thực tế.

---

# 18. Current Stopping Point

Phiên hiện tại kết thúc tại:

```text
ARCHITECTURE FOUNDATION
        ↓
CORE FOUNDATION IDENTIFIED
        ↓
IDENTITY / LOGIN IDENTIFIED
        ↓
ORGANIZATION / MEMBERSHIP IDENTIFIED
        ↓
PERMISSION IDENTIFIED
        ↓
WORK SELECTED AS FIRST BUSINESS MODULE
```

Điểm tiếp tục của phiên sau:

> **Thiết kế Core Foundation, bắt đầu từ Identity / Account / Login và Organization / Membership.**

Sau khi Core Foundation đủ rõ, chuyển sang đặc tả WORK.

---

# 19. Next Session Rule

Khi bắt đầu lại, đọc:

```text
START_HERE.md
PROJECT_STATE.md
```

Sau đó tiếp tục trực tiếp từ:

```text
CORE FOUNDATION
        ↓
IDENTITY / ACCOUNT / LOGIN
```

Không xây lại Architecture Foundation đã hoàn thành trừ khi phát hiện mâu thuẫn hoặc cần một Architecture Decision mới.

---

# 20. Final State

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

CORE FOUNDATION           IDENTIFIED
IDENTITY / LOGIN          NEXT
ORGANIZATION              NEXT
PERMISSION IMPLEMENTATION NEXT

FIRST BUSINESS MODULE:
WORK                      SELECTED

IMPLEMENTATION            NOT STARTED
```

---

# 21. Final Project Statement

SAOVN-OS đang được xây dựng như một **môi trường làm việc online thống nhất cho tập đoàn SAOVN**.

Nền tảng sẽ có một Core Foundation dùng chung cho Identity, Organization và Access Control.

Cổng vào hệ thống là Login.

Tài khoản không mặc định được tạo bằng Public Self-Registration; Organization sẽ là chủ thể cấp, mời hoặc Provision Account.

Sau khi xác thực và xác định quyền, người dùng bước vào môi trường làm việc chính.

**WORK là Business Module đầu tiên được lựa chọn**, tập trung vào giao việc, nhận việc, quản lý Project, theo dõi tiến độ, Deadline, trao đổi và báo cáo công việc.

Điểm tiếp theo của dự án là biến Core Foundation và WORK từ kiến trúc thành thiết kế kỹ thuật và sau đó là hệ thống chạy thật.
