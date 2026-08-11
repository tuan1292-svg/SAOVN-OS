# SAOVN-OS — PERMISSION MODEL

## 1. Purpose

Permission Model định nghĩa cách SAOVN-OS xác định:

* Ai là người sử dụng hệ thống.
* Người đó thuộc tổ chức nào.
* Người đó có vai trò gì.
* Người đó được phép thực hiện hành động nào.
* Người đó được phép truy cập phạm vi dữ liệu nào.
* Ai có quyền phê duyệt.
* Quyền có thể được ủy quyền như thế nào.
* Ranh giới bảo mật của từng tổ chức và tài nguyên.

Permission Model là nền tảng bảo mật và kiểm soát truy cập của toàn bộ SAOVN-OS.

---

## 2. Core Principle

SAOVN-OS không xác định quyền chỉ dựa trên chức danh.

Quyền truy cập được xác định từ nhiều yếu tố:

```text
Identity
   ↓
Organization Membership
   ↓
Role
   ↓
Permission
   ↓
Scope
   ↓
Resource
   ↓
Action
   ↓
Policy Decision
```

Một người có chức danh cao không mặc nhiên có toàn quyền đối với mọi dữ liệu.

---

## 3. Identity

Identity đại diện cho một thực thể có thể xác thực với SAOVN-OS.

Identity có thể thuộc các nhóm:

* Human User
* System Account
* Service Account
* AI Agent

Identity phải có định danh duy nhất trong hệ thống.

Identity không đồng nghĩa với Role.

Một Identity có thể có nhiều Membership và nhiều Role trong các phạm vi khác nhau.

---

## 4. Organization

SAOVN-OS hỗ trợ cấu trúc tổ chức nhiều cấp.

Ví dụ:

```text
SAOVN
│
├── Company A
│   ├── Department A1
│   └── Department A2
│
├── Company B
│   ├── Department B1
│   └── Department B2
│
└── Shared Services
```

Organization Boundary được sử dụng để xác định phạm vi dữ liệu và quyền.

---

## 5. Membership

Membership biểu diễn quan hệ giữa Identity và Organization.

Một Identity có thể:

* Thuộc một tổ chức.
* Thuộc nhiều tổ chức.
* Có vai trò khác nhau trong từng tổ chức.
* Có phạm vi quyền khác nhau trong từng tổ chức.

Ví dụ:

```text
User A
│
├── Company A
│   └── Manager
│
└── Company B
    └── Employee
```

Quyền của User A trong Company A không tự động áp dụng cho Company B.

---

## 6. Role

Role là tập hợp có ý nghĩa nghiệp vụ của các Permission.

Các Role cơ bản có thể bao gồm:

* Founder
* CEO
* Executive
* Director
* Manager
* Team Lead
* Employee
* Intern
* Collaborator
* External Partner
* System Administrator

Role không phải là Permission.

Ví dụ:

```text
Manager
   ↓
Permissions
   ├── project.view
   ├── project.create
   ├── project.update
   └── team.view
```

---

## 7. Permission

Permission đại diện cho một hành động cụ thể mà một Identity có thể thực hiện.

Permission có cấu trúc khái niệm:

```text
resource.action
```

Ví dụ:

```text
user.view
user.update

project.view
project.create
project.update
project.delete

document.view
document.create
document.update
document.delete

report.view
report.export
```

Permission phải mô tả hành động, không mô tả chức danh.

---

## 8. Resource

Resource là đối tượng mà Permission được áp dụng.

Ví dụ:

* User
* Organization
* Department
* Project
* Task
* Document
* File
* Report
* Customer
* Contract

Một Permission chỉ có ý nghĩa khi được đánh giá trên Resource cụ thể.

---

## 9. Action

Action mô tả hành động được thực hiện trên Resource.

Các Action phổ biến:

```text
view
create
update
delete
approve
reject
assign
export
share
archive
restore
```

Không phải Resource nào cũng hỗ trợ tất cả Action.

---

## 10. Scope

Scope xác định phạm vi mà Permission có hiệu lực.

Các Scope cơ bản:

```text
GLOBAL
ORGANIZATION
COMPANY
DEPARTMENT
TEAM
PROJECT
RESOURCE
SELF
```

Ví dụ:

```text
project.view
Scope: ORGANIZATION
```

có nghĩa là người dùng có thể xem các Project thuộc Organization mà họ được phép truy cập.

Trong khi:

```text
profile.update
Scope: SELF
```

chỉ cho phép người dùng cập nhật hồ sơ của chính mình.

---

## 11. Data Visibility

Quyền truy cập dữ liệu phải được xác định độc lập với khả năng thực hiện Action.

Các mức Visibility có thể gồm:

```text
PRIVATE
TEAM
DEPARTMENT
ORGANIZATION
COMPANY
SHARED
PUBLIC
```

Ví dụ:

Một nhân viên có thể có:

```text
project.view = true
```

nhưng chỉ nhìn thấy:

```text
scope = TEAM
```

Người quản lý có thể có cùng Permission nhưng:

```text
scope = DEPARTMENT
```

---

## 12. Ownership

Một số Resource có Owner.

Ví dụ:

* Document Owner
* Project Owner
* Task Assignee
* Personal Profile Owner

Ownership có thể tạo ra quyền đặc biệt.

Ví dụ:

```text
document.update
```

có thể được cấp cho:

* Owner.
* Manager.
* Người có Permission phù hợp.

Ownership không được tự động biến thành quyền quản trị toàn hệ thống.

---

## 13. Approval Authority

Một số hành động yêu cầu phê duyệt.

Ví dụ:

```text
Expense
   ↓
Submit
   ↓
Manager Approval
   ↓
Finance Approval
   ↓
Completed
```

Permission thực hiện hành động và Authority phê duyệt là hai khái niệm riêng.

Một người có thể được phép tạo yêu cầu nhưng không có quyền phê duyệt yêu cầu đó.

---

## 14. Delegation

SAOVN-OS hỗ trợ Delegation trong những trường hợp được cho phép.

Delegation phải xác định:

* Người ủy quyền.
* Người được ủy quyền.
* Permission được ủy quyền.
* Scope.
* Thời gian hiệu lực.
* Điều kiện.
* Audit Trail.

Delegation không được tạo ra quyền vượt quá quyền của người ủy quyền.

Nguyên tắc:

```text
Delegated Permission
    ≤
Delegator Permission
```

---

## 15. Temporary Permission

Một số quyền có thể có thời hạn.

Ví dụ:

```text
Permission:
project.approve

Granted To:
User A

Scope:
Project X

Valid:
2026-01-01 → 2026-01-15
```

Khi hết thời hạn, Permission tự động mất hiệu lực.

---

## 16. Permission Evaluation

Mỗi yêu cầu truy cập phải được đánh giá theo Context.

Context tối thiểu:

```text
Identity
Organization
Membership
Role
Permission
Resource
Action
Scope
Ownership
Policy
Time
```

Luồng đánh giá:

```text
Request
   ↓
Identify User
   ↓
Identify Organization
   ↓
Load Membership
   ↓
Resolve Roles
   ↓
Resolve Permissions
   ↓
Evaluate Scope
   ↓
Evaluate Resource
   ↓
Evaluate Policy
   ↓
ALLOW / DENY
```

---

## 17. Default Deny

SAOVN-OS áp dụng nguyên tắc:

> Không có Permission rõ ràng thì không được phép thực hiện Action.

Mặc định:

```text
UNKNOWN → DENY
```

Không được suy luận rằng người dùng có quyền chỉ vì họ có một Role hoặc chức danh tương tự.

---

## 18. Explicit Grant

Quyền truy cập nên được cấp rõ ràng thông qua:

* Role.
* Permission Assignment.
* Resource Policy.
* Delegation.
* Ownership.

Không nên tạo quyền ngầm khó kiểm tra.

---

## 19. Conflict Resolution

Khi nhiều chính sách quyền cùng áp dụng, hệ thống phải có quy tắc xác định kết quả.

Nguyên tắc mặc định:

```text
Explicit Deny
    ↓
Overrides
    ↓
Allow
```

Nếu không có Allow hợp lệ:

```text
DENY
```

Các ngoại lệ phải được định nghĩa bằng Policy rõ ràng.

---

## 20. Organization Boundary

Dữ liệu của một Organization không được tự động truy cập bởi Identity thuộc Organization khác.

Ví dụ:

```text
Company A
   │
   ├── User A
   └── Data A

Company B
   │
   ├── User B
   └── Data B
```

User A không được truy cập Data B nếu không có Permission và Policy cho phép.

---

## 21. Cross-Organization Access

Cross-Organization Access chỉ được phép khi có chính sách rõ ràng.

Ví dụ:

```text
Company A
      │
      │ approved access
      ▼
Shared Resource
      ▲
      │
Company B
```

Mọi Cross-Organization Access phải có:

* Chủ thể.
* Resource.
* Action.
* Scope.
* Policy.
* Audit.

---

## 22. AI Agent Permission

AI Agent được xem là một Identity đặc biệt.

AI Agent phải có:

* Agent Identity.
* Assigned Role hoặc Permission.
* Tool Permission.
* Data Scope.
* Action Scope.
* Audit.

AI Agent không mặc định có quyền như Administrator.

Ví dụ:

```text
Sales Agent
   │
   ├── customer.view
   ├── customer.update
   └── report.view
```

Agent không được tự động:

```text
user.delete
organization.delete
permission.grant
```

nếu không được cấp rõ ràng.

---

## 23. System Administrator

System Administrator có quyền quản trị nền tảng nhưng không mặc định có quyền truy cập mọi dữ liệu nghiệp vụ.

Platform Administration và Business Data Access phải được phân biệt.

Ví dụ:

```text
System Administration
    ≠
Business Authority
```

Điều này giúp giảm rủi ro lạm dụng quyền quản trị kỹ thuật.

---

## 24. Audit

Các hoạt động liên quan đến Permission phải có Audit Trail.

Các sự kiện quan trọng:

* Permission Granted.
* Permission Revoked.
* Role Assigned.
* Role Removed.
* Delegation Created.
* Delegation Revoked.
* Policy Changed.
* Access Allowed.
* Access Denied.
* Sensitive Resource Accessed.

Audit phải ghi nhận tối thiểu:

```text
Actor
Action
Resource
Scope
Result
Timestamp
Organization
Context
```

---

## 25. Permission Architecture

Kiến trúc quyền tổng thể:

```text
IDENTITY
   ↓
MEMBERSHIP
   ↓
ROLE
   ↓
PERMISSION
   ↓
SCOPE
   ↓
POLICY
   ↓
RESOURCE
   ↓
ACTION
   ↓
DECISION
   ↓
AUDIT
```

---

## 26. Permission Model Principles

SAOVN-OS Permission Model tuân thủ:

1. Default Deny.
2. Least Privilege.
3. Explicit Permission.
4. Organization Boundary.
5. Scope-based Access.
6. Separation of Duties.
7. Temporary Access when necessary.
8. Delegation must be bounded.
9. AI Agent must be permissioned.
10. Sensitive actions must be auditable.

---

## 27. Dependency

Permission Model là dependency của:

* Data Model.
* Identity Architecture.
* Organization Architecture.
* Application Architecture.
* API Architecture.
* AI Agent Architecture.
* Audit Architecture.

Do đó Permission Model phải được xác định trước khi hoàn thiện Data Model.

---

## 28. Future Extension

Permission Model phải có khả năng mở rộng để hỗ trợ:

* Attribute-Based Access Control.
* Policy-Based Access Control.
* Conditional Access.
* Time-based Access.
* Location-aware Policy.
* Resource-level Permission.
* Workflow-based Approval.
* AI Agent Policy.
* External Partner Access.

Các cơ chế nâng cao chỉ được bổ sung khi có nhu cầu thực tế.

---

## 29. Final Principle

Permission trong SAOVN-OS không chỉ trả lời:

> "Người này có quyền gì?"

Mà phải trả lời đầy đủ:

> "Ai được phép làm gì, trên tài nguyên nào, trong tổ chức nào, ở phạm vi nào, trong điều kiện nào, trong thời gian nào và dưới sự kiểm soát của chính sách nào?"

Đây là nguyên tắc nền tảng của Security Model SAOVN-OS.
