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

Mục tiêu hiện tại là xây dựng nền tảng kiến trúc và các nguyên tắc cốt lõi của SAOVN-OS trước khi triển khai các Application và Module cụ thể.

Thứ tự phát triển được xác định:

```text
Vision
  ↓
Constitution
  ↓
Architecture
  ↓
Module Specification
  ↓
Technical Design
  ↓
Implementation
  ↓
Testing
  ↓
Deployment
```

---

# 3. Current Project Phase

**Current Phase: Architecture Foundation**

Trạng thái:

```text
Vision                 ✓
Constitution           ✓
Core Architecture      ✓
Technical Architecture ✓
Architecture Decisions ✓
Module Specification   ✓
Implementation         NOT STARTED
```

Implementation chưa phải trọng tâm của giai đoạn hiện tại.

---

# 4. Repository Structure

Cấu trúc Repository hiện tại:

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

Các lớp kiến trúc đã được định nghĩa:

## Vision

`DOCS/VISION/SAOVN-OS.md`

Định nghĩa SAOVN-OS là môi trường làm việc online và nền tảng vận hành thống nhất cho SAOVN.

---

## Constitution

`00_CONSTITUTION/`

Chứa các nguyên tắc nền tảng và quy tắc xây dựng hệ thống.

Bao gồm:

```text
AI_BUILD_RULES.md
MASTER_BLUEPRINT.md
```

---

## Domain Model

`01_ARCHITECTURE/DOMAIN_MODEL.md`

Định nghĩa các Domain nghiệp vụ và ranh giới nghiệp vụ của SAOVN-OS.

---

## Module Map

`01_ARCHITECTURE/MODULE_MAP.md`

Định nghĩa các nhóm Module và mối quan hệ giữa các Module.

---

## System Architecture

`01_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`

Định nghĩa kiến trúc hệ thống tổng thể và cách các thành phần lớn của SAOVN-OS được tổ chức.

---

## Permission Model

`01_ARCHITECTURE/PERMISSION_MODEL.md`

Định nghĩa cách Identity, Organization, Role, Permission, Scope và Policy phối hợp để kiểm soát quyền truy cập.

---

## Data Model

`01_ARCHITECTURE/DATA_MODEL.md`

Định nghĩa cách dữ liệu được tổ chức, sở hữu và liên kết giữa các Domain.

---

## Integration Architecture

`01_ARCHITECTURE/INTEGRATION_ARCHITECTURE.md`

Định nghĩa cách SAOVN-OS giao tiếp với:

* Các Module nội bộ.
* Các Service.
* External Systems.
* API.
* Events.
* Webhooks.
* Adapters.
* AI Services.

---

## Technical Architecture

`01_ARCHITECTURE/TECHNICAL_ARCHITECTURE.md`

Định nghĩa kiến trúc kỹ thuật tổng thể gồm:

```text
Web Client
API
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
Deployment
AI Layer
```

Technical Architecture cố gắng giữ độc lập với một Framework hoặc Vendor cụ thể.

---

## Architecture Decisions

`01_ARCHITECTURE/ARCHITECTURE_DECISIONS.md`

Đã ghi nhận các quyết định kiến trúc quan trọng, bao gồm:

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

---

## Module Specification

`01_ARCHITECTURE/MODULE_SPECIFICATION.md`

Định nghĩa tiêu chuẩn để một Module được thiết kế trước khi triển khai.

Một Module cần xác định:

```text
Identity
Purpose
Scope
Domain
Actors
Responsibilities
Entities
Data Ownership
Permissions
API
Events
Workflows
Integrations
UI
Notifications
AI
Audit
Security
Dependencies
Failure Handling
Performance
Acceptance Criteria
```

Module chỉ được xem là Ready for Development khi các Boundary và Requirement quan trọng đã rõ ràng.

---

# 6. Current Architectural Model

Mô hình tổng thể hiện tại:

```text
                         SAOVN-OS
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
     CORE PLATFORM                       APPLICATIONS
          │                                   │
    ┌─────┼─────┐                    ┌────────┼────────┐
    │     │     │                    │        │        │
 Identity Org Permission           HR       CRM     Projects
    │
    ├── Audit
    ├── Notification
    ├── File
    ├── Search
    └── Event
```

Technical flow:

```text
User
 ↓
Web Client
 ↓
API / Gateway
 ↓
Application
 ↓
Core / Domain
 ↓
Data Access
 ↓
Database / Cache / Storage
 ↓
Event / Queue / Workers
 ↓
External Systems
```

AI được đặt như một Layer có thể tích hợp:

```text
Applications
     ↑
  AI Layer
     ↓
AI Provider / Tools
```

AI không được trở thành Single Point of Failure cho những nghiệp vụ không phụ thuộc AI.

---

# 7. Core Architectural Principles

Các nguyên tắc cần tiếp tục giữ:

```text
Modular
API First
Web First
Security by Design
Least Privilege
Domain Boundaries
Explicit Data Ownership
Source of Truth
Provider Independence
Observable by Default
Scalable
Replaceable Components
Automation First
Documentation as Living Architecture
```

---

# 8. Current Development Rule

Trước khi triển khai một Module quan trọng:

```text
Architecture
 ↓
Module Specification
 ↓
Technical Design
 ↓
Implementation
 ↓
Testing
 ↓
Deployment
```

Không tự ý bỏ qua Architecture Boundary để triển khai nhanh.

---

# 9. What We Are Actually Building

SAOVN-OS đang được xây như một **nền tảng làm việc trực tuyến thống nhất cho SAOVN**.

Nó hướng tới việc đưa các năng lực sau vào cùng một môi trường:

```text
People
Organization
Identity
Permissions
Projects
Tasks
Documents
Communication
Business Applications
Data
Integrations
AI
Analytics
```

Các Application cụ thể sẽ được xây trên Core Platform thay vì trở thành những hệ thống rời rạc.

---

# 10. What Has NOT Been Built Yet

Tại thời điểm chốt sổ này:

```text
Production Application       NOT BUILT
Production Backend           NOT BUILT
Production Database          NOT BUILT
Production API               NOT BUILT
Production AI Agent          NOT BUILT
Deployment Infrastructure   NOT BUILT
```

Các nội dung trên thuộc giai đoạn Implementation sau này.

---

# 11. Next Phase

Bước tiếp theo sau Architecture Foundation là bắt đầu chuyển Architecture thành các **Module Specifications cụ thể**.

Trước tiên cần xác định:

```text
Which Module should be built first?
```

Sau khi chọn Module đầu tiên:

```text
Module Selection
 ↓
Module Specification
 ↓
Technical Design
 ↓
Data Design
 ↓
API Design
 ↓
UI Design
 ↓
Implementation
 ↓
Testing
```

Không nên chọn thứ tự Module chỉ dựa trên việc Module nào dễ code nhất.

Ưu tiên nên dựa trên:

* Foundation Dependency.
* Business Value.
* Architectural Importance.
* Data Dependency.
* Security Dependency.
* Ability to unlock other Modules.

---

# 12. Recommended Next Investigation

Trước khi bắt đầu Implementation lớn, cần xác định:

```text
1. Core Module nào phải tồn tại trước?
2. Application đầu tiên của SAOVN-OS là gì?
3. Module nào là Dependency của các Module khác?
4. Data Ownership thực tế của từng Core Entity?
5. Identity và Organization Model cần triển khai ở mức nào?
6. Technology Stack nào phù hợp?
7. Deployment Model ban đầu là gì?
```

Các câu hỏi này sẽ dẫn sang Technical Design và Implementation.

---

# 13. Session Closing Point

Phiên làm việc hiện tại kết thúc tại:

```text
ARCHITECTURE FOUNDATION
        ↓
MODULE SPECIFICATION
        ↓
READY TO SELECT FIRST REAL MODULE
```

Đây là điểm tiếp tục cho phiên làm việc tiếp theo.

Không cần xây lại các tài liệu Architecture đã hoàn thành trừ khi phát hiện mâu thuẫn hoặc có quyết định kiến trúc mới.

---

# 14. Working Protocol

Quy trình làm việc giữa User và AI:

```text
1. Xác định file cần xây.
2. Giới thiệu ngắn gọn file đó dùng để làm gì.
3. Đưa nguyên khối nội dung hoàn chỉnh.
4. User copy vào đúng vị trí.
5. User commit + push.
6. User báo "đã up".
7. Tiếp tục file kế tiếp.
8. Khi User nói "chốt sổ":
   → Tổng hợp PROJECT_STATE.md một lần.
```

Không tạo Project State sau từng bước nhỏ.

Không lặp lại dài dòng các giải thích đã được xác lập.

---

# 15. Continuation Rule

Khi bắt đầu phiên làm việc mới, đọc:

```text
START_HERE.md
PROJECT_STATE.md
```

Sau đó sử dụng Architecture hiện có để tiếp tục từ:

```text
READY TO SELECT FIRST REAL MODULE
```

Không bắt đầu lại từ đầu.

---

# 16. Current Status

```text
SAOVN-OS

VISION                 COMPLETE
CONSTITUTION           COMPLETE
DOMAIN MODEL           COMPLETE
MODULE MAP             COMPLETE
SYSTEM ARCHITECTURE    COMPLETE
PERMISSION MODEL       COMPLETE
DATA MODEL              COMPLETE
INTEGRATION             COMPLETE
TECHNICAL ARCHITECTURE COMPLETE
ARCHITECTURE DECISIONS COMPLETE
MODULE SPECIFICATION   COMPLETE

ARCHITECTURE FOUNDATION COMPLETE

NEXT:
SELECT FIRST REAL MODULE
```

---

# 17. Final Project State

**SAOVN-OS đã hoàn thành lớp Architecture Foundation đầu tiên.**

Điểm hiện tại không phải là:

> "Chúng ta chưa làm gì."

Mà là:

> **"Chúng ta đã định nghĩa bộ khung, luật, dữ liệu, boundary và cách xây Module của hệ điều hành làm việc SAOVN. Bước tiếp theo là chọn Module thực tế đầu tiên và đưa nó từ Specification sang Technical Design rồi Implementation."**
