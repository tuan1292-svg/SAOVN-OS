# SAOVN-OS — PROJECT STATE
# TRẠNG THÁI DỰ ÁN

> SAOVN — Tổ chức Hành động Đặc biệt vì Việt Nam
>
> SAOVN — Special Action Organization for Vietnam

Document Type: Project State / AI Context
Version: 1.0
Status: Active
Language: Vietnamese + English

---

# 01. PROJECT IDENTITY
# NHẬN DIỆN DỰ ÁN

Project Name:

SAOVN-OS

Full Organization Name:

SAOVN — Tổ chức Hành động Đặc biệt vì Việt Nam

English:

SAOVN — Special Action Organization for Vietnam

Project Type:

Organizational Operating System

Project Purpose:

Xây dựng một môi trường làm việc trực tuyến toàn diện cho tập đoàn SAOVN, nơi Founder, CEO, quản lý, nhân viên, thực tập sinh, cộng tác viên và các thành viên liên quan có thể làm việc, phối hợp, quản lý dữ liệu, tri thức, nhiệm vụ, dự án và hoạt động của tổ chức.

English:

Build a comprehensive online organizational operating system for SAOVN where founders, executives, managers, employees, interns, collaborators and related members can work, collaborate, manage information, knowledge, tasks, projects and organizational operations.

---

# 02. CORE VISION
# TẦM NHÌN CỐT LÕI

SAOVN-OS is NOT being built primarily as a commercial product.

SAOVN-OS is being built first as an internal operating environment for the SAOVN organization.

The primary objective is:

BUILD FOR USE FIRST.

COMMERCIALIZATION IS OPTIONAL.

The system may eventually become more capable than existing commercial platforms, but competing with them is NOT the primary objective.

---

# 03. CORE PHILOSOPHY
# TRIẾT LÝ CỐT LÕI

SAOVN-OS must be:

```text
Professional
Chuyên nghiệp

Modular
Module hóa

Scalable
Có khả năng mở rộng

Secure
An toàn

Maintainable
Dễ bảo trì

Understandable
Dễ hiểu

Low-Cost First
Ưu tiên chi phí thấp

AI-Ready
Sẵn sàng cho AI

Human-Operable
Con người có thể vận hành mà không cần AI
04. AI PRINCIPLE
NGUYÊN TẮC AI

AI IS OPTIONAL.

SAOVN-OS MUST WORK WITHOUT AI.

The system must not require paid AI services for normal operation.

Initial architecture should rely primarily on:

Structured Data
Business Rules
Workflows
Reports
Dashboards
Human Decision Making

AI will be an optional future layer.

When resources become available, AI can be integrated without redesigning the entire Core.

Target architecture:

SAOVN-OS CORE
      ↓
AI GATEWAY
      ↓
AI PROVIDER / LOCAL MODEL / FUTURE PROVIDER

Business modules must NOT directly depend on a specific AI provider.

05. CURRENT ARCHITECTURE PHASE
GIAI ĐOẠN HIỆN TẠI

Current Phase:

ARCHITECTURE FOUNDATION

Objective:

Build and validate the organizational, domain and technical architecture before serious application development begins.

06. COMPLETED DOCUMENTS
TÀI LIỆU ĐÃ HOÀN THÀNH
Constitution
00_CONSTITUTION/AI_BUILD_RULES.md
STATUS: COMPLETE

00_CONSTITUTION/MASTER_BLUEPRINT.md
STATUS: COMPLETE
Architecture
01_ARCHITECTURE/SYSTEM_ARCHITECTURE.md
STATUS: COMPLETE

01_ARCHITECTURE/DOMAIN_MODEL.md
STATUS: COMPLETE

01_ARCHITECTURE/MODULE_MAP.md
STATUS: COMPLETE
Project Navigation
START_HERE.md
STATUS: COMPLETE
07. CURRENT ARCHITECTURE TREE
CÂY KIẾN TRÚC HIỆN TẠI
SAOVN-OS/
│
├── 00_CONSTITUTION/
│   ├── AI_BUILD_RULES.md
│   └── MASTER_BLUEPRINT.md
│
├── 01_ARCHITECTURE/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DOMAIN_MODEL.md
│   └── MODULE_MAP.md
│
├── PROJECT_STATE.md
├── START_HERE.md
└── .gitignore
08. NEXT ARCHITECTURE STEPS
CÁC BƯỚC KIẾN TRÚC TIẾP THEO

The planned order is:

1. Permission Model
2. Data Model
3. Integration Architecture
4. Technical Architecture
5. Module Specifications
6. Application Architecture
7. Infrastructure Architecture
8. Implementation

IMPORTANT:

Do NOT skip architectural dependencies merely to start coding faster.

09. IMMEDIATE NEXT STEP
BƯỚC KẾ TIẾP TRỰC TIẾP

NEXT:

01_ARCHITECTURE/PERMISSION_MODEL.md

Purpose:

Define:

Identity
Roles
Permissions
Scopes
Access Policies
Organization Boundaries
Data Visibility
Approval Authority
Delegation
Security Boundaries

Permission Model must be completed before finalizing the Data Model.

10. WHY PERMISSION COMES BEFORE DATA
VÌ SAO PHÂN QUYỀN ĐI TRƯỚC DỮ LIỆU

SAOVN-OS will contain multiple classes of users:

Founder
CEO
Executive
Director
Manager
Team Lead
Employee
Intern
Collaborator
External Partner
System Administrator

Each user may have different:

Access
Visibility
Authority
Responsibilities
Approval Rights
Data Scope

Therefore data architecture must be designed with authorization boundaries in mind.

11. CURRENT MODULE ARCHITECTURE
KIẾN TRÚC MODULE HIỆN TẠI

Core groups identified:

FOUNDATION

PEOPLE

STRATEGY

WORK

KNOWLEDGE

COMMUNICATION

BUSINESS

FINANCE

OPERATIONS

GOVERNANCE

ANALYTICS

INTEGRATION

AI

PLATFORM

Detailed definitions are stored in:

01_ARCHITECTURE/MODULE_MAP.md
12. CORE MODULE PRIORITY
ƯU TIÊN MODULE

P0:

Identity
Organization
Access Control
Audit
Configuration
Notification

P1:

People
Projects
Tasks
Documents
Files
Knowledge
Calendar
Meetings
Search
Dashboard

P2:

Strategy
Goals
OKR
KPI
Performance
Reporting
Executive Dashboard
Governance

P3:

CRM
Sales
Marketing
Procurement
Inventory
Customer Support

P4:

Finance
Accounting
Budget
Expenses
Revenue
Assets
Equipment
Logistics
Resource Planning

P5:

API
Webhooks
External Integrations
Import / Export
Automation

P6:

AI Gateway
AI Providers
AI Agents
AI Context
AI Tools
AI Automation
AI Governance
13. DEVELOPMENT PRINCIPLE
NGUYÊN TẮC PHÁT TRIỂN

SAOVN-OS must be built as a modular system.

Do not create isolated pages that later become impossible to integrate.

Every new feature must answer:

Which Module owns this?
Which Domain owns this?
Which Entity owns this?
Who can access it?
What does it depend on?
What depends on it?
What events does it create?
What APIs expose it?
How will it be tested?
How can it be extended later?
14. AI BUILD PROTOCOL
QUY TRÌNH AI KHI THAM GIA XÂY DỰNG

Before modifying the project, AI MUST:

1. Read START_HERE.md
2. Read PROJECT_STATE.md
3. Read relevant Constitution documents
4. Read relevant Architecture documents
5. Understand existing dependencies
6. Identify the current phase
7. Confirm the intended change
8. Avoid breaking existing architecture
9. Update documentation when architecture changes
10. Update PROJECT_STATE.md when project state changes

AI must NOT:

Invent architecture without checking existing documents.

Rewrite existing architecture casually.

Create duplicate systems for the same responsibility.

Introduce unnecessary dependencies.

Make AI a mandatory dependency without explicit architectural approval.

Hard-code business logic into UI.

Allow modules to bypass permission boundaries.

Directly access another module's private database without an approved architectural contract.
15. LOW-COST DEVELOPMENT STRATEGY
CHIẾN LƯỢC PHÁT TRIỂN CHI PHÍ THẤP

Initial system should prioritize:

Open Source
Free Tiers
Self-Hosted Options
Simple Infrastructure
Structured Data
Efficient Architecture
Manual Workflows Where Appropriate

Paid infrastructure and AI should only be introduced when justified by:

Business Value
Scale
Reliability
Security
Time Savings
Revenue
16. EXECUTIVE VISION
TẦM NHÌN FOUNDER / CEO

The final system should allow leadership to understand organizational health through structured dashboards.

Target areas:

People Health
Project Health
Task Health
Financial Health
Operational Health
Strategic Health
Risk Health
Growth Health

The system should answer these through:

Data
Metrics
KPIs
Reports
Dashboards

AI may later provide natural-language analysis, but AI is NOT required for the initial executive system.

17. DATA AS ORGANIZATIONAL MEMORY
DỮ LIỆU LÀ TRÍ NHỚ TỔ CHỨC

SAOVN-OS should preserve structured organizational knowledge.

Important entities include:

People
Organizations
Departments
Teams
Projects
Tasks
Goals
KPIs
Documents
Decisions
Risks
Events
Transactions
Activities

The quality of this structured data will determine future reporting, automation and AI capabilities.

18. REPOSITORY AS PROJECT MEMORY
REPOSITORY LÀ BỘ NHỚ DỰ ÁN

GitHub Repository is the persistent project memory.

Conversation history is NOT the authoritative source of architecture.

The authoritative sources are:

00_CONSTITUTION/
01_ARCHITECTURE/
PROJECT_STATE.md
START_HERE.md

If conversation history conflicts with the repository:

THE REPOSITORY MUST BE TREATED AS THE PRIMARY PROJECT SOURCE OF TRUTH.

19. DAILY AI WORK SESSION
QUY TRÌNH MỖI NGÀY

At the beginning of a work session:

Open Repository
      ↓
Read START_HERE.md
      ↓
Read PROJECT_STATE.md
      ↓
Read relevant architecture
      ↓
Identify current task
      ↓
Work
      ↓
Update documents
      ↓
Update PROJECT_STATE.md
      ↓
Commit
      ↓
Push
20. END-OF-DAY REQUIREMENT
QUY ĐỊNH CUỐI NGÀY

Before ending a significant work session:

PROJECT_STATE.md should reflect:

Completed
In Progress
Next Step
Important Decisions
Known Issues
Architecture Changes

The goal is that another AI can continue the project without relying on today's conversation.

21. CURRENT STATUS SNAPSHOT
ẢNH CHỤP TRẠNG THÁI HIỆN TẠI

Completed:

✓ Repository created
✓ Git initialized
✓ GitHub remote connected
✓ Initial commit completed
✓ Constitution created
✓ Master Blueprint created
✓ AI Build Rules created
✓ System Architecture created
✓ Domain Model created
✓ Module Map created
✓ START_HERE created

Current:

Architecture Foundation

Next:

Create Permission Model
22. IMPORTANT ARCHITECTURAL DECISIONS
CÁC QUYẾT ĐỊNH KIẾN TRÚC QUAN TRỌNG

Decision 001:

SAOVN-OS is primarily an internal organizational operating system.

Decision 002:

The architecture must be modular.

Decision 003:

AI is optional and must not be required for normal operation.

Decision 004:

The initial system should prioritize low cost.

Decision 005:

AI integration must happen through an abstraction layer / AI Gateway.

Decision 006:

The repository is the long-term project memory.

Decision 007:

Architecture must be established before large-scale implementation.

Decision 008:

The system must support Founder, executives, managers, employees, interns and collaborators with different permissions.

Decision 009:

The system should be designed for future expansion into multiple business domains.

Decision 010:

The system must be bilingual-ready:

Vietnamese
English

23. DO NOT BREAK
NHỮNG THỨ TUYỆT ĐỐI KHÔNG ĐƯỢC PHÁ

Do NOT:

Make AI mandatory.

Tie the entire system to one AI provider.

Tie business logic directly to UI.

Create uncontrolled direct database dependencies between modules.

Ignore permissions.

Mix unrelated business domains into one module.

Delete architectural documents without review.

Change core architecture without documenting the decision.

Build features that contradict the Constitution.

Optimize for appearance before structural correctness.
24. NEXT SESSION INSTRUCTION
CHỈ DẪN CHO PHIÊN LÀM VIỆC TIẾP THEO

When starting a new AI session, use the following instruction:

We are continuing the SAOVN-OS project.

Please access and read the public GitHub repository.

First read:

START_HERE.md
PROJECT_STATE.md

Then read:

00_CONSTITUTION/

01_ARCHITECTURE/

Determine:

1. What SAOVN-OS is.
2. What has already been completed.
3. What architectural decisions have been made.
4. What the current project phase is.
5. What the next correct step is.

Do not invent a new architecture.
Do not repeat completed work.
Do not skip architectural dependencies.

Continue from the repository state.

Vietnamese:

Chúng ta đang tiếp tục xây dựng dự án SAOVN-OS.

Hãy truy cập và đọc repository GitHub public của dự án.

Đầu tiên đọc:

START_HERE.md
PROJECT_STATE.md

Sau đó đọc:

00_CONSTITUTION/

01_ARCHITECTURE/

Hãy xác định:

1. SAOVN-OS là gì.
2. Những gì đã hoàn thành.
3. Những quyết định kiến trúc đã được thống nhất.
4. Dự án hiện đang ở giai đoạn nào.
5. Bước tiếp theo chính xác là gì.

Không tự ý phát minh kiến trúc mới.
Không làm lại những thứ đã hoàn thành.
Không bỏ qua các phụ thuộc kiến trúc.

Hãy tiếp tục từ trạng thái thực tế của repository.
25. END
HẾT PROJECT STATE