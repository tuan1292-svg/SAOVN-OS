# SAOVN-OS — DATA MODEL

## 1. Purpose

Data Model định nghĩa các thực thể dữ liệu cốt lõi của SAOVN-OS, mối quan hệ giữa chúng và các nguyên tắc quản lý dữ liệu.

Data Model là mô hình nghiệp vụ cấp cao.

Tài liệu này không định nghĩa:

* Database Engine.
* SQL Schema.
* Table Index.
* ORM Model.
* API Implementation.

Các quyết định kỹ thuật sẽ được thực hiện ở các tài liệu Technical Architecture và Implementation Specification.

---

# 2. Data Model Principles

SAOVN-OS Data Model tuân thủ:

1. Domain First.
2. Single Source of Truth.
3. Clear Ownership.
4. Explicit Relationships.
5. Organization Boundary.
6. Permission-aware Data.
7. Auditability.
8. Extensibility.
9. Referential Integrity.
10. Minimal Duplication.

---

# 3. Core Entity Groups

Dữ liệu SAOVN-OS được chia thành các nhóm chính:

```text
IDENTITY
    ↓
ORGANIZATION
    ↓
PEOPLE
    ↓
WORK
    ↓
CONTENT
    ↓
COMMUNICATION
    ↓
SYSTEM
    ↓
AUDIT
```

---

# 4. Identity Domain

## 4.1 User

User đại diện cho một con người sử dụng SAOVN-OS.

Thông tin khái niệm:

```text
User
├── id
├── identity
├── profile
├── status
└── metadata
```

User không trực tiếp quyết định quyền.

Quyền được xác định thông qua Membership, Role, Permission và Policy.

---

## 4.2 Identity

Identity đại diện cho danh tính có thể xác thực trong hệ thống.

Identity có thể liên kết với:

* Human User.
* Service Account.
* AI Agent.

Một Identity có định danh duy nhất.

---

## 4.3 User Profile

Profile chứa thông tin mô tả người dùng.

Ví dụ:

* Display Name.
* Avatar.
* Contact Information.
* Job Information.
* Preferences.

Profile không được dùng thay thế cho Permission Model.

---

# 5. Organization Domain

## 5.1 Organization

Organization đại diện cho một đơn vị tổ chức trong SAOVN-OS.

Organization có thể đại diện cho:

* Tập đoàn.
* Công ty thành viên.
* Đơn vị.
* Phòng ban.
* Nhóm.

Cấu trúc Organization có thể phân cấp.

```text
SAOVN
├── Company A
│   ├── Department A1
│   └── Department A2
│
└── Company B
    ├── Department B1
    └── Department B2
```

---

## 5.2 Organization Relationship

Organization có thể có quan hệ:

* Parent.
* Child.
* Member.
* Partner.
* Shared Service.

Quan hệ tổ chức phải được xác định rõ để phục vụ Permission và Data Scope.

---

## 5.3 Department

Department là đơn vị chức năng bên trong Organization.

Ví dụ:

* Human Resources.
* Finance.
* Sales.
* Marketing.
* Technology.

Department có thể có:

* Members.
* Manager.
* Teams.
* Projects.
* Resources.

---

## 5.4 Team

Team là nhóm làm việc bên trong Organization hoặc Department.

Team thường phục vụ:

* Collaboration.
* Projects.
* Tasks.
* Communication.

---

# 6. Membership Domain

## 6.1 Membership

Membership biểu diễn quan hệ:

```text
Identity
    ↓
Organization
```

Membership có thể chứa:

* Identity.
* Organization.
* Role.
* Status.
* Start Date.
* End Date.
* Scope.

Một Identity có thể có nhiều Membership.

---

## 6.2 Role

Role là tập hợp Permission có ý nghĩa nghiệp vụ.

Ví dụ:

```text
Manager
├── project.view
├── project.create
├── project.update
└── team.view
```

Role không phải là User.

---

## 6.3 Permission

Permission đại diện cho khả năng thực hiện một Action trên Resource.

Ví dụ:

```text
project.view
project.create
project.update
document.view
document.update
```

Permission Model được định nghĩa chi tiết trong:

```text
01_ARCHITECTURE/PERMISSION_MODEL.md
```

---

# 7. Work Domain

Work Domain chứa các thực thể phục vụ công việc hàng ngày.

---

## 7.1 Project

Project đại diện cho một mục tiêu hoặc đơn vị công việc có phạm vi xác định.

Project có thể thuộc:

* Organization.
* Department.
* Team.

Project có:

* Owner.
* Members.
* Tasks.
* Documents.
* Milestones.
* Status.

---

## 7.2 Task

Task đại diện cho một đơn vị công việc cụ thể.

Task có thể:

* Thuộc Project.
* Được giao cho User.
* Được giao cho Team.
* Có Deadline.
* Có Priority.
* Có Status.

Ví dụ:

```text
Project
   │
   ├── Task
   ├── Task
   └── Task
```

---

## 7.3 Milestone

Milestone đại diện cho một mốc quan trọng của Project.

Milestone có thể chứa:

* Name.
* Description.
* Target Date.
* Status.
* Related Tasks.

---

## 7.4 Workflow

Workflow đại diện cho một chuỗi trạng thái hoặc hành động nghiệp vụ.

Ví dụ:

```text
Draft
  ↓
Submitted
  ↓
Review
  ↓
Approved
  ↓
Completed
```

Workflow có thể được sử dụng bởi nhiều Application.

---

# 8. Content Domain

## 8.1 Document

Document đại diện cho một tài liệu nghiệp vụ hoặc nội bộ.

Document có thể thuộc:

* User.
* Team.
* Department.
* Organization.
* Project.

Document phải hỗ trợ Permission và Visibility.

---

## 8.2 File

File đại diện cho dữ liệu vật lý hoặc binary content được lưu trữ.

File có thể được liên kết với:

* Document.
* Project.
* Task.
* User.
* Organization.

File Storage và File Metadata phải được phân biệt.

---

## 8.3 Folder

Folder đại diện cho cấu trúc tổ chức File và Document.

Folder có thể chứa:

* Folder con.
* Document.
* File.

---

## 8.4 Knowledge

Knowledge đại diện cho thông tin có thể được sử dụng bởi người dùng hoặc AI.

Knowledge có thể đến từ:

* Document.
* Wiki.
* Procedure.
* Policy.
* FAQ.
* Database.
* External Source.

Knowledge phải có:

* Source.
* Owner.
* Scope.
* Permission.
* Version.

---

# 9. Communication Domain

## 9.1 Conversation

Conversation đại diện cho một không gian trao đổi.

Có thể là:

* Direct Message.
* Group Conversation.
* Team Conversation.
* Project Conversation.

---

## 9.2 Message

Message là một nội dung được gửi trong Conversation.

Message có:

* Sender.
* Conversation.
* Content.
* Timestamp.
* Attachments.
* Metadata.

---

## 9.3 Notification

Notification đại diện cho thông báo gửi tới User hoặc System Actor.

Ví dụ:

* Task Assigned.
* Approval Required.
* Mention.
* System Alert.
* Workflow Update.

---

# 10. Customer Domain

Customer Domain phục vụ các hoạt động liên quan đến khách hàng và đối tác.

---

## 10.1 Customer

Customer đại diện cho một khách hàng của SAOVN hoặc một đơn vị có quan hệ kinh doanh.

Customer có thể liên kết với:

* Contacts.
* Projects.
* Contracts.
* Opportunities.
* Activities.

---

## 10.2 Contact

Contact đại diện cho một cá nhân liên hệ của Customer hoặc Partner.

Contact không nhất thiết là User của SAOVN-OS.

---

## 10.3 Partner

Partner đại diện cho tổ chức hoặc cá nhân có quan hệ hợp tác với SAOVN.

Partner có thể có quyền truy cập giới hạn vào các Resource được chia sẻ.

---

# 11. Finance Domain

Finance Domain sẽ được mở rộng theo nhu cầu nghiệp vụ thực tế.

Các thực thể dự kiến:

* Account.
* Transaction.
* Invoice.
* Expense.
* Budget.
* Payment.
* Financial Report.

Các thực thể Finance phải tuân thủ:

* Organization Boundary.
* Permission Model.
* Approval Workflow.
* Audit.

---

# 12. AI Domain

AI Domain chứa các thực thể phục vụ AI Layer.

---

## 12.1 AI Agent

AI Agent là một Identity đặc biệt có khả năng thực hiện các nhiệm vụ được cấp quyền.

Agent có:

* Identity.
* Role.
* Permission.
* Tools.
* Knowledge Scope.
* Memory Scope.

---

## 12.2 AI Tool

Tool là khả năng mà AI Agent được phép sử dụng.

Ví dụ:

```text
search_documents
create_task
read_project
send_notification
generate_report
```

Tool Access phải được kiểm soát bằng Permission.

---

## 12.3 AI Memory

Memory lưu trữ thông tin được phép sử dụng cho hoạt động của AI.

Memory phải có:

* Owner.
* Scope.
* Source.
* Retention Policy.
* Permission.

AI Memory không mặc định được chia sẻ cho mọi Agent.

---

# 13. Audit Domain

## 13.1 Audit Event

Audit Event ghi nhận các hoạt động quan trọng trong hệ thống.

Ví dụ:

```text
LOGIN
LOGOUT
CREATE
UPDATE
DELETE
APPROVE
REJECT
PERMISSION_GRANTED
PERMISSION_REVOKED
ACCESS_DENIED
```

Audit Event phải có:

* Actor.
* Action.
* Resource.
* Timestamp.
* Organization.
* Result.
* Context.

---

# 14. Configuration Domain

Configuration chứa các thiết lập của hệ thống.

Có thể bao gồm:

* Organization Settings.
* Application Settings.
* User Preferences.
* Feature Flags.
* Workflow Configuration.
* AI Configuration.

Configuration phải có Scope rõ ràng.

---

# 15. Entity Relationships

Các quan hệ nền tảng:

```text
Identity
   │
   └── Membership
          │
          └── Organization
                 │
                 ├── Department
                 │      └── Team
                 │
                 └── Projects
                        ├── Tasks
                        ├── Milestones
                        └── Documents
```

---

# 16. Identity Relationships

```text
User
  │
  └── Identity
         │
         └── Membership
                │
                ├── Organization
                └── Role
                       │
                       └── Permission
```

---

# 17. Work Relationships

```text
Organization
     │
     └── Project
            │
            ├── Members
            ├── Tasks
            ├── Milestones
            └── Documents
```

Một Project có thể liên kết với nhiều Organization-level resources theo Permission và Policy.

---

# 18. Content Relationships

```text
Organization
     │
     └── Folder
           ├── Folder
           ├── Document
           │     └── File
           └── File
```

Document và File phải có Owner và Access Scope.

---

# 19. AI Relationships

```text
Identity
   │
   └── AI Agent
          ├── Role
          ├── Permission
          ├── Tools
          ├── Knowledge
          └── Memory
```

AI Agent sử dụng cùng Permission Model với các System Actor khác nhưng có thêm các giới hạn riêng của AI Layer.

---

# 20. Ownership Model

Các Entity quan trọng phải xác định Owner hoặc Responsible Party.

Ví dụ:

```text
Project → Owner
Document → Owner
Task → Assignee
Knowledge → Owner
AI Agent → Responsible Organization
Workflow → Owner
```

Ownership không thay thế Permission.

---

# 21. Lifecycle

Các Entity nghiệp vụ cần có Lifecycle phù hợp.

Ví dụ:

```text
Draft
   ↓
Active
   ↓
Archived
   ↓
Deleted
```

Không phải Entity nào cũng cần toàn bộ Lifecycle.

Việc xóa dữ liệu phải tuân thủ Retention và Audit Policy.

---

# 22. Versioning

Các loại dữ liệu cần lịch sử thay đổi phải hỗ trợ Versioning.

Ví dụ:

* Document.
* Knowledge.
* Workflow.
* Policy.
* Configuration.

Versioning phải cho phép xác định:

* Version.
* Author.
* Timestamp.
* Change.
* Previous Version.

---

# 23. Soft Delete

Các dữ liệu quan trọng không nên mặc định bị xóa vật lý ngay khi người dùng thực hiện Delete.

Có thể sử dụng trạng thái:

```text
ACTIVE
ARCHIVED
DELETED
```

Việc Permanent Delete phải tuân thủ Policy và quyền phù hợp.

---

# 24. Data Ownership

Dữ liệu có thể thuộc:

* User.
* Team.
* Department.
* Organization.
* SAOVN Platform.

Ownership phải được xác định rõ.

Dữ liệu của một Organization không được mặc định trở thành dữ liệu chung của toàn bộ SAOVN.

---

# 25. Data Scope

Data Scope phải tương thích với Permission Model.

Các Scope cơ bản:

```text
SELF
TEAM
DEPARTMENT
COMPANY
ORGANIZATION
PROJECT
RESOURCE
GLOBAL
```

Data Scope không được vượt quá Permission Scope.

---

# 26. Data Integrity

Các quan hệ dữ liệu phải đảm bảo:

* Không tạo orphan record ngoài chủ ý.
* Không tham chiếu Resource không tồn tại.
* Không phá vỡ Organization Boundary.
* Không tạo Permission không hợp lệ.
* Không tạo Ownership không xác định.

---

# 27. Data Security

Dữ liệu nhạy cảm phải có:

* Access Control.
* Encryption khi phù hợp.
* Audit.
* Retention Policy.
* Data Classification khi cần.

Data Model không quyết định implementation security nhưng phải tạo đủ boundary để Technical Architecture triển khai.

---

# 28. Data Classification

Dữ liệu có thể được phân loại:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
SENSITIVE
```

Classification ảnh hưởng tới:

* Visibility.
* Permission.
* Sharing.
* Export.
* Retention.
* Audit.

---

# 29. Cross-Domain Relationships

Các Domain có thể liên kết nhưng phải giữ boundary.

Ví dụ:

```text
HR
 │
 └── User / Employee
          │
          └── Project
                │
                └── Finance
```

Cross-Domain Relationship phải được định nghĩa rõ thay vì để các Domain phụ thuộc trực tiếp vào implementation của nhau.

---

# 30. Data Ownership Principle

Một dữ liệu nghiệp vụ chỉ nên có một Domain chịu trách nhiệm chính.

Ví dụ:

```text
User Identity
→ Identity Domain

Organization
→ Organization Domain

Project
→ Work Domain

Document
→ Content Domain

Customer
→ Customer Domain

Audit Event
→ Audit Domain
```

Các Domain khác có thể tham chiếu dữ liệu nhưng không được tự tạo một bản sao làm Source of Truth.

---

# 31. Source of Truth

Mỗi loại dữ liệu phải có một Source of Truth.

Ví dụ:

```text
Identity
→ Identity Domain

Organization
→ Organization Domain

Permission
→ Permission System

Project
→ Work Domain

Document
→ Content Domain
```

Cache, Search Index, Analytics Store và AI Knowledge Index không được trở thành Source of Truth nếu không được xác định rõ.

---

# 32. Extensibility

Data Model phải có khả năng mở rộng để hỗ trợ:

* Công ty mới.
* Department mới.
* Application mới.
* Domain mới.
* AI Agent mới.
* Integration mới.
* Workflow mới.

Việc mở rộng không được phá vỡ các Entity Core.

---

# 33. Core Data Model

Các Entity nền tảng của SAOVN-OS:

```text
Identity
User
Organization
Department
Team
Membership
Role
Permission
Project
Task
Document
File
Conversation
Message
Notification
Audit Event
Configuration
AI Agent
AI Tool
AI Knowledge
AI Memory
```

Đây là danh sách Core Data Model ở cấp khái niệm.

Các Application có thể bổ sung Entity riêng trong Domain của mình.

---

# 34. Data Model Dependency

Data Model phụ thuộc vào:

```text
DOMAIN MODEL
      ↓
PERMISSION MODEL
      ↓
DATA MODEL
      ↓
INTEGRATION ARCHITECTURE
      ↓
TECHNICAL ARCHITECTURE
```

Data Model là cầu nối giữa Domain Architecture và Technical Architecture.

---

# 35. Final Principle

Data Model của SAOVN-OS không chỉ mô tả:

> "Chúng ta lưu những dữ liệu gì?"

Mà phải trả lời:

> "Dữ liệu này thuộc Domain nào, ai sở hữu, liên kết với gì, ai được truy cập, trong phạm vi nào và vòng đời của nó ra sao?"

Đây là nguyên tắc nền tảng để SAOVN-OS có thể phát triển thành một Organizational Operating System thống nhất.
