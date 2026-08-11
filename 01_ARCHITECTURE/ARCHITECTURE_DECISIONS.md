# SAOVN-OS — ARCHITECTURE DECISIONS

## 1. Purpose

Architecture Decisions ghi lại các quyết định quan trọng ảnh hưởng đến kiến trúc, khả năng phát triển, vận hành và mở rộng của SAOVN-OS.

Mục tiêu:

* Giữ lại lý do của các quyết định.
* Tránh quyết định lại cùng một vấn đề.
* Giúp thành viên mới hiểu kiến trúc.
* Làm cơ sở cho Technical Architecture.
* Theo dõi các quyết định có thể thay đổi trong tương lai.

---

# 2. Decision Principles

Mỗi quyết định quan trọng nên xác định:

```text
Context
Problem
Options
Decision
Reasons
Trade-offs
Consequences
Status
```

Không ghi lại mọi quyết định nhỏ.

Chỉ ghi những quyết định có ảnh hưởng đáng kể đến hệ thống.

---

# 3. Decision Status

Các trạng thái:

```text
PROPOSED
ACCEPTED
SUPERSEDED
DEPRECATED
REJECTED
```

Ý nghĩa:

* PROPOSED — đang được đề xuất.
* ACCEPTED — đã được chấp nhận.
* SUPERSEDED — đã được quyết định khác thay thế.
* DEPRECATED — không còn được khuyến nghị.
* REJECTED — đã xem xét nhưng không lựa chọn.

---

# 4. Decision Record Format

Mỗi Architecture Decision sử dụng cấu trúc:

```text
# ADR-XXXX — Title

## Status

ACCEPTED

## Context

...

## Problem

...

## Options

### Option A

...

### Option B

...

### Option C

...

## Decision

...

## Reasons

...

## Trade-offs

...

## Consequences

...

## Related Documents

...
```

---

# 5. ADR-0001 — SAOVN-OS as Organizational Operating System

## Status

ACCEPTED

## Context

SAOVN cần một môi trường làm việc trực tuyến thống nhất để quản lý con người, tổ chức, công việc, dữ liệu, tài liệu, giao tiếp và các hệ thống nghiệp vụ.

Các ứng dụng riêng lẻ không đủ để tạo ra một môi trường vận hành thống nhất.

## Problem

Nếu mỗi nghiệp vụ được xây thành một hệ thống độc lập mà không có Platform Architecture chung, hệ thống có nguy cơ:

* Trùng lặp dữ liệu.
* Trùng lặp Identity.
* Trùng lặp Permission.
* Khó tích hợp.
* Khó mở rộng.
* Trải nghiệm người dùng không thống nhất.

## Decision

SAOVN-OS được xây dựng như một **Organizational Operating System** cho SAOVN.

SAOVN-OS cung cấp:

* Core Platform.
* Shared Identity.
* Organization Model.
* Permission Model.
* Data Model.
* Integration Layer.
* Application Platform.
* AI Layer.

## Reasons

Mô hình Platform giúp các Application sử dụng chung nền tảng và dữ liệu cốt lõi.

## Trade-offs

Kiến trúc Platform ban đầu cần đầu tư nhiều hơn so với việc xây một Application độc lập.

Đổi lại, hệ thống có khả năng mở rộng và tái sử dụng tốt hơn.

## Consequences

Các Application mới phải tuân thủ Core Architecture của SAOVN-OS.

---

# 6. ADR-0002 — Core Platform and Applications

## Status

ACCEPTED

## Context

SAOVN-OS cần hỗ trợ nhiều nghiệp vụ khác nhau.

## Problem

Nếu tất cả nghiệp vụ được xây thành một khối duy nhất, hệ thống sẽ khó bảo trì.

Nếu mỗi nghiệp vụ trở thành một hệ thống hoàn toàn độc lập, sẽ tạo ra quá nhiều duplication.

## Decision

SAOVN-OS sử dụng mô hình:

```text
Core Platform
      ↓
Applications
```

Core cung cấp năng lực dùng chung.

Application chứa Business Capability riêng.

## Reasons

Mô hình này cân bằng giữa:

* Reuse.
* Modularity.
* Independence.
* Consistency.

## Consequences

Core phải được thiết kế ổn định.

Application không được tự xây lại Core Capability nếu capability đã tồn tại.

---

# 7. ADR-0003 — Shared Identity

## Status

ACCEPTED

## Context

Một người có thể sử dụng nhiều Application.

## Problem

Nếu mỗi Application quản lý User riêng:

```text
HR User
CRM User
Project User
Finance User
```

sẽ tạo ra Identity Fragmentation.

## Decision

SAOVN-OS sử dụng một Identity Model dùng chung.

```text
Identity
   ↓
Membership
   ↓
Organization
   ↓
Application Access
```

## Reasons

Một người phải có một Identity thống nhất trong hệ sinh thái SAOVN-OS.

## Consequences

Application phải sử dụng Core Identity thay vì tạo User System riêng nếu không có lý do đặc biệt.

---

# 8. ADR-0004 — Central Permission Model

## Status

ACCEPTED

## Context

Nhiều Application cần kiểm soát quyền truy cập.

## Problem

Nếu mỗi Application tự định nghĩa Permission:

```text
HR Permission
CRM Permission
Finance Permission
Project Permission
```

thì Permission sẽ không nhất quán.

## Decision

SAOVN-OS sử dụng Permission Model chung.

Permission được kiểm soát thông qua:

```text
Identity
 ↓
Membership
 ↓
Role
 ↓
Permission
 ↓
Scope
 ↓
Policy
```

## Reasons

Central Permission Model tạo ra một Security Boundary thống nhất.

## Consequences

Application phải tích hợp Permission Model thay vì tự tạo một hệ thống quyền hoàn toàn độc lập.

---

# 9. ADR-0005 — Domain Ownership

## Status

ACCEPTED

## Context

Nhiều Application có thể cần sử dụng cùng dữ liệu.

## Problem

Nếu nhiều Service cùng sở hữu một loại dữ liệu:

```text
CRM → Customer
Finance → Customer
Project → Customer
```

sẽ tạo ra nhiều Source of Truth.

## Decision

Mỗi Business Entity có một Domain Owner chính.

Các Domain khác tham chiếu thông qua Contract.

## Reasons

Giảm duplication và bảo vệ Data Integrity.

## Consequences

Cross-Domain Access phải thông qua API, Event hoặc Contract phù hợp.

---

# 10. ADR-0006 — API as Integration Boundary

## Status

ACCEPTED

## Context

Các Client và Service cần giao tiếp.

## Decision

API được sử dụng làm Boundary chính cho synchronous communication.

```text
Client
 ↓
API
 ↓
Application
 ↓
Domain
```

## Reasons

API tạo Contract rõ ràng và kiểm soát Security.

## Consequences

Client không được truy cập trực tiếp Database.

---

# 11. ADR-0007 — Event Driven for Asynchronous Work

## Status

ACCEPTED

## Context

Một số hoạt động không cần phản hồi ngay.

## Decision

Sử dụng Event và Queue cho các tác vụ phù hợp.

Ví dụ:

```text
ProjectCreated
     ↓
Event
     ├── Notification
     ├── Audit
     └── AI
```

## Reasons

Giảm Coupling và hỗ trợ Background Processing.

## Consequences

Hệ thống phải xử lý:

* Retry.
* Duplicate Events.
* Event Ordering khi cần.
* Failure Handling.

---

# 12. ADR-0008 — AI as an Optional Layer

## Status

ACCEPTED

## Context

AI là một thành phần quan trọng trong tương lai của SAOVN-OS.

## Problem

Nếu Core phụ thuộc trực tiếp vào AI:

```text
Core
 ↓
AI
```

AI Provider hoặc AI Service bị lỗi có thể ảnh hưởng toàn bộ hệ thống.

## Decision

AI được xây dựng như một Layer có thể tích hợp với Core và Applications nhưng không phải dependency bắt buộc của mọi nghiệp vụ.

```text
Core
  ↑
AI Layer
```

AI sử dụng Permission và Tool Boundary.

## Reasons

Cho phép AI phát triển độc lập và có thể thay đổi Provider.

## Consequences

Các nghiệp vụ quan trọng phải hoạt động được khi AI unavailable nếu nghiệp vụ đó không yêu cầu AI.

---

# 13. ADR-0009 — Provider Independence

## Status

ACCEPTED

## Context

SAOVN-OS có thể sử dụng nhiều External Provider.

## Decision

External Provider được tích hợp thông qua Adapter hoặc Integration Boundary.

```text
Domain
 ↓
Internal Interface
 ↓
Adapter
 ↓
Provider
```

## Reasons

Giảm Vendor Lock-in.

## Consequences

Business Logic không được phụ thuộc trực tiếp vào Vendor API.

---

# 14. ADR-0010 — Source of Truth

## Status

ACCEPTED

## Context

SAOVN-OS có nhiều Data Store và External System.

## Decision

Mỗi loại dữ liệu phải có Source of Truth rõ ràng.

Cache, Search Index và AI Index không mặc định là Source of Truth.

## Reasons

Tránh Data Conflict.

## Consequences

Integration phải xác định Ownership và Synchronization Policy.

---

# 15. ADR-0011 — Repository as Project Source of Truth

## Status

ACCEPTED

## Context

SAOVN-OS cần một nơi lưu trữ Architecture và Project State.

## Decision

Git Repository là Source of Truth cho:

* Architecture.
* Constitution.
* Documentation.
* Project State.
* Build Rules.
* Technical Decisions.

## Reasons

Git cung cấp:

* Version History.
* Traceability.
* Collaboration.
* Recovery.

## Consequences

Các tài liệu kiến trúc quan trọng phải được lưu trong Repository.

---

# 16. ADR-0012 — Documentation Before Implementation

## Status

ACCEPTED

## Context

SAOVN-OS là một hệ thống lớn với nhiều Domain và Application.

## Decision

Kiến trúc nền tảng phải được định nghĩa trước khi triển khai các Module chính.

```text
Vision
 ↓
Constitution
 ↓
Architecture
 ↓
Specification
 ↓
Implementation
```

## Reasons

Giảm việc xây sai kiến trúc và giảm rework.

## Consequences

Implementation phải tuân thủ Architecture đã được chấp nhận.

---

# 17. ADR-0013 — Incremental Architecture

## Status

ACCEPTED

## Context

SAOVN-OS sẽ phát triển trong thời gian dài.

## Decision

Architecture được xây dựng và hoàn thiện theo từng lớp.

Không cố định toàn bộ chi tiết kỹ thuật ngay từ đầu.

## Reasons

Requirements và quy mô hệ thống có thể thay đổi.

## Consequences

Architecture phải có khả năng tiến hóa.

Các quyết định quan trọng phải được ghi nhận khi xuất hiện.

---

# 18. ADR-0014 — Security by Default

## Status

ACCEPTED

## Context

SAOVN-OS quản lý dữ liệu tổ chức và dữ liệu nghiệp vụ.

## Decision

Security là thuộc tính mặc định của Architecture.

Nguyên tắc:

```text
Deny by Default
Least Privilege
Explicit Access
Auditable Actions
```

## Consequences

Feature mới phải xác định Security Model trước khi triển khai.

---

# 19. ADR-0015 — Organization Boundary

## Status

ACCEPTED

## Context

SAOVN-OS có thể chứa nhiều Company, Department và Organization.

## Decision

Dữ liệu phải có Organization Scope phù hợp.

Một User có quyền trong Organization này không mặc định có quyền trong Organization khác.

## Reasons

Bảo vệ Data Isolation.

## Consequences

Cross-Organization Access phải được cấp rõ ràng.

---

# 20. ADR-0016 — Web First

## Status

ACCEPTED

## Context

SAOVN-OS được định hướng là môi trường làm việc trực tuyến.

## Decision

Web là Client Platform chính.

Các Client khác có thể được xây dựng sau nếu có nhu cầu.

## Reasons

Web cung cấp:

* Cross Platform.
* Central Deployment.
* Easy Updates.
* Enterprise Accessibility.

## Consequences

Core Experience phải hoạt động tốt trên Web.

---

# 21. ADR-0017 — Architecture over Framework

## Status

ACCEPTED

## Context

Framework và Technology có vòng đời ngắn hơn Business Architecture.

## Decision

Architecture phải độc lập tương đối với Framework.

Framework chỉ là Implementation Detail nếu không ảnh hưởng đến Architecture.

## Reasons

Giảm Technology Lock-in.

## Consequences

Technical Decisions phải được ghi nhận riêng khi cần.

---

# 22. ADR-0018 — Decision Reversibility

## Status

ACCEPTED

## Context

Không phải mọi quyết định đều có cùng mức độ khó thay đổi.

## Decision

Architecture ưu tiên:

```text
Reversible Decisions
```

trong giai đoạn đầu khi chưa có đủ thông tin.

Các quyết định khó đảo ngược phải được đánh giá kỹ hơn.

Ví dụ:

* Core Data Model.
* Identity Model.
* Organization Boundary.
* Security Model.
* Primary Storage Strategy.

---

# 23. ADR-0019 — No Premature Microservices

## Status

ACCEPTED

## Context

SAOVN-OS có nhiều Domain nhưng không phải Domain nào cũng cần một Microservice riêng ngay từ đầu.

## Decision

Không mặc định biến mọi Module thành Microservice.

Service Boundary sẽ được xác định dựa trên:

* Domain Boundary.
* Team Ownership.
* Scaling Requirement.
* Reliability Requirement.
* Deployment Independence.
* Operational Cost.

## Reasons

Microservices quá sớm có thể tạo ra:

* Operational Complexity.
* Network Complexity.
* Deployment Complexity.
* Data Consistency Problems.

## Consequences

SAOVN-OS có thể bắt đầu với Modular Architecture và tách Service khi thực sự cần.

---

# 24. ADR-0020 — Architecture Documentation as Living System

## Status

ACCEPTED

## Context

Architecture sẽ thay đổi khi SAOVN-OS phát triển.

## Decision

Documentation được xem là Living Architecture.

Khi một quyết định lớn thay đổi:

```text
New Decision
    ↓
ADR
    ↓
Architecture Update
    ↓
Implementation
```

Không sửa lịch sử quyết định cũ để che giấu thay đổi.

Nếu một quyết định bị thay thế, ADR cũ chuyển thành:

```text
SUPERSEDED
```

và liên kết tới quyết định mới.

---

# 25. ADR Governance

Một Architecture Decision quan trọng nên được xem xét trước khi:

* Thay đổi Core Identity.
* Thay đổi Permission Model.
* Thay đổi Data Ownership.
* Thay đổi Organization Boundary.
* Thay đổi Integration Strategy.
* Thay đổi Deployment Model.
* Thay đổi AI Security Model.
* Thay đổi Source of Truth.

---

# 26. Decision Review

Architecture Decision có thể được Review khi:

* Requirements thay đổi.
* Quy mô hệ thống thay đổi.
* Technology thay đổi.
* Security Requirement thay đổi.
* Business Model thay đổi.

Review không có nghĩa là quyết định cũ sai.

Một quyết định có thể đúng trong Context cũ nhưng không còn phù hợp trong Context mới.

---

# 27. Final Principle

Architecture Decisions tồn tại để trả lời một câu hỏi quan trọng:

> "Tại sao SAOVN-OS lại được xây theo cách này?"

Không chỉ ghi lại:

> "Chúng ta đã chọn gì?"

mà còn phải ghi lại:

> "Vì sao chọn nó, đã cân nhắc gì, đánh đổi gì và khi nào cần xem xét lại?"

Architecture Decision Records là bộ nhớ dài hạn của các quyết định kiến trúc SAOVN-OS.
