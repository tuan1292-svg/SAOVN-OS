# SAOVN-OS — START HERE
# SAOVN-OS — BẮT ĐẦU TỪ ĐÂY

> SAOVN — Tổ chức Hành động Đặc biệt vì Việt Nam
>
> SAOVN — Special Action Organization for Vietnam
>
> SAOVN-OS — Hệ điều hành tổ chức và Trụ sở số của SAOVN
>
> SAOVN-OS — SAOVN Organizational Operating System & Digital Headquarters

---

# 01. WELCOME — CHÀO MỪNG

Chào mừng đến với SAOVN-OS.

Đây là hệ thống vận hành tổ chức số được xây dựng dành riêng cho SAOVN.

SAOVN-OS không được xây dựng để bán ra thị trường hoặc cạnh tranh với bất kỳ nền tảng nào.

Mục tiêu trước tiên là:

> Xây dựng một môi trường làm việc số toàn diện để SAOVN sử dụng trong hoạt động thực tế.

Hệ thống phục vụ:

- Founder;
- CEO;
- Executive;
- Director;
- Manager;
- Employee;
- Intern;
- Collaborator;
- Project Member;
- các thành viên khác của tổ chức.

---

# 02. THE VISION — TẦM NHÌN

SAOVN-OS là:

> DIGITAL HEADQUARTERS OF SAOVN
>
> TRỤ SỞ SỐ CỦA SAOVN

Mục tiêu là đưa phần lớn hoạt động tổ chức lên một môi trường số thống nhất.

Một thành viên khi đăng nhập phải có thể hiểu:

- Tôi là ai?
- Tôi thuộc tổ chức nào?
- Tôi thuộc phòng ban nào?
- Tôi giữ vai trò gì?
- Tôi có quyền gì?
- Tôi đang phụ trách việc gì?
- Tôi phải hoàn thành việc gì?
- Tôi đang tham gia dự án nào?
- Công việc của tôi đóng góp vào mục tiêu nào?
- Kết quả công việc của tôi ra sao?

Founder / CEO phải có thể nhìn thấy:

- Tổ chức đang ở đâu?
- Con người đang thế nào?
- Công việc đang chạy ra sao?
- Dự án nào tốt?
- Dự án nào gặp vấn đề?
- Mục tiêu nào đang đạt?
- Mục tiêu nào đang chậm?
- Rủi ro nằm ở đâu?
- Có vấn đề gì cần quyết định?

---

# 03. THE MOST IMPORTANT RULE — NGUYÊN TẮC QUAN TRỌNG NHẤT

SAOVN-OS không phải một tập hợp các website độc lập.

SAOVN-OS là:

> ONE ORGANIZATIONAL SYSTEM
>
> MỘT HỆ THỐNG TỔ CHỨC THỐNG NHẤT

Các module phải được xây trên một Core chung.

Ví dụ:

```text
CORE
│
├── Identity
├── Organization
├── Membership
├── Role
├── Permission
├── Audit
├── Notification
├── Files
├── Search
└── Events
       │
       ▼
APPLICATION MODULES
       │
       ├── Goals
       ├── Tasks
       ├── Projects
       ├── Workflow
       ├── Knowledge
       ├── Documents
       ├── HR
       ├── Finance
       ├── CRM
       └── Future Modules
       Không được xây từng module như một hệ thống riêng biệt.

04. READ THESE FIRST — ĐỌC NHỮNG FILE NÀY TRƯỚC

Khi bắt đầu một phiên làm việc mới, AI hoặc thành viên kỹ thuật phải đọc tài liệu theo thứ tự:

01
↓
00_CONSTITUTION/MASTER_BLUEPRINT.md

02
↓
00_CONSTITUTION/AI_BUILD_RULES.md

03
↓
01_ARCHITECTURE/SYSTEM_ARCHITECTURE.md

04
↓
Các Architecture Documents liên quan

05
↓
Domain Specifications liên quan

06
↓
Implementation Documentation liên quan

07
↓
Source Code

Không được bắt đầu thay đổi Core chỉ bằng cách đọc Source Code.

05. AUTHORITY HIERARCHY — THỨ TỰ THẨM QUYỀN

Khi có mâu thuẫn giữa tài liệu và code, phải xác định nguyên nhân.

Thứ tự tham chiếu:

MASTER_BLUEPRINT
        ↓
AI_BUILD_RULES
        ↓
SYSTEM_ARCHITECTURE
        ↓
DOMAIN ARCHITECTURE
        ↓
DATA ARCHITECTURE
        ↓
PERMISSION ARCHITECTURE
        ↓
MODULE SPECIFICATION
        ↓
TECHNICAL ARCHITECTURE
        ↓
IMPLEMENTATION

Source Code không tự động có quyền cao hơn Architecture.

06. CURRENT PROJECT STATUS — TRẠNG THÁI HIỆN TẠI

Current Stage:

FOUNDATION ARCHITECTURE

Tiếng Việt:

Giai đoạn xây dựng nền móng kiến trúc.

Hiện tại:

Constitution
        ✅
Architecture
        ✅
Domain Model
        ⏳
Data Model
        ⏳
Permission Model
        ⏳
Module Map
        ⏳
Technical Architecture
        ⏳
Core Implementation
        ⏳
Application Modules
        ⏳
Production
        ⏳

Chưa được coi là bước vào giai đoạn xây dựng Application hoàn chỉnh.

07. CURRENT TREE — CÂY HỆ THỐNG HIỆN TẠI
SAOVN-OS/
│
├── 00_CONSTITUTION/
│   ├── AI_BUILD_RULES.md
│   └── MASTER_BLUEPRINT.md
│
├── 01_ARCHITECTURE/
│   └── SYSTEM_ARCHITECTURE.md
│
├── START_HERE.md
│
└── .gitignore

Đây là cấu trúc nền hiện tại.

Cấu trúc sẽ tiếp tục phát triển theo Architecture.

Không tự ý tạo hàng loạt thư mục hoặc module chỉ vì nghĩ rằng "sau này sẽ cần".

08. CURRENT ARCHITECTURAL OBJECTIVE — MỤC TIÊU HIỆN TẠI

Trước khi viết Application Code, chúng ta cần hoàn thiện các tài liệu nền:

01_ARCHITECTURE/

SYSTEM_ARCHITECTURE.md
DOMAIN_MODEL.md
DATA_MODEL.md
PERMISSION_MODEL.md
MODULE_MAP.md
INTEGRATION_ARCHITECTURE.md
TECHNICAL_ARCHITECTURE.md

Các tài liệu này sẽ mô tả:

hệ thống gồm những gì;
các Entity là gì;
chúng liên hệ với nhau thế nào;
dữ liệu được tổ chức ra sao;
quyền hoạt động thế nào;
module nào tồn tại;
module phụ thuộc module nào;
hệ thống kết nối bên ngoài ra sao;
công nghệ và hạ tầng được triển khai thế nào.
09. BUILD PHILOSOPHY — TRIẾT LÝ XÂY DỰNG

SAOVN-OS phải tuân thủ:

DESIGN FOR THE FUTURE

BUILD FOR THE PRESENT

Thiết kế phải chừa đường cho tương lai.

Nhưng triển khai hiện tại phải phù hợp nguồn lực thực tế.

Ví dụ:

AI chưa cần dùng ngay.

Nhưng Architecture phải chừa:

AI Gateway
AI Context
AI Tools
AI Security
AI Provider Adapter

để tương lai có thể tích hợp AI mà không phải viết lại Core.

10. ZERO-AI PRINCIPLE — NGUYÊN TẮC KHÔNG PHỤ THUỘC AI

SAOVN-OS hiện tại không được phụ thuộc vào AI trả phí.

Core phải hoạt động bình thường khi:

AI = OFF

Hệ thống vẫn phải có thể:

quản lý người;
quản lý tổ chức;
quản lý quyền;
quản lý công việc;
quản lý dự án;
quản lý tài liệu;
quản lý quy trình;
tính KPI;
tạo báo cáo;
hiển thị Dashboard.

AI là:

OPTIONAL INTELLIGENCE LAYER

AI không phải:

CORE DEPENDENCY

11. DATA FIRST — DỮ LIỆU TRƯỚC AI

SAOVN-OS phải xây theo:

DATA
 ↓
BUSINESS RULES
 ↓
METRICS
 ↓
REPORTS
 ↓
DASHBOARD
 ↓
OPTIONAL AI

Không được xây hệ thống mà AI phải "đoán" những dữ liệu lẽ ra Database phải lưu có cấu trúc.

12. MODULARITY — KIẾN TRÚC MODULE

Mỗi module phải có ranh giới.

Một module phải xác định:

Purpose;
Responsibility;
Entities;
APIs;
Events;
Permissions;
Data Ownership;
Dependencies;
Metrics;
Audit;
Extension Points.

Không được tạo module mà không biết nó thuộc đâu trong Architecture.

13. CORE FIRST — XÂY LÕI TRƯỚC

Core Foundation dự kiến:

Identity
Organization
Membership
Role
Permission
Audit
Notification
Files
Search
Events
Configuration
Integration

Sau Core mới phát triển:

Goals
Tasks
Projects
Workflow
Approvals
Documents
Knowledge
Metrics
Reports
Dashboards
Business Modules
AI
14. DOMAIN MODEL — MÔ HÌNH THẾ GIỚI SAOVN

Thế giới SAOVN-OS được mô hình hóa thông qua các thực thể.

Ví dụ:

Person
User
Organization
Company
Department
Team
Position
Membership
Role
Permission
Goal
Project
Task
Workflow
Document
Knowledge
Event
Audit
Metric
KPI
Report
Dashboard

Domain Model chính thức sẽ được định nghĩa trong:

01_ARCHITECTURE/DOMAIN_MODEL.md
15. DATA MODEL — MÔ HÌNH DỮ LIỆU

Data Model chính thức sẽ được định nghĩa trong:

01_ARCHITECTURE/DATA_MODEL.md

Không tự ý thiết kế Database Production trước khi Data Model đủ rõ.

16. PERMISSION MODEL — MÔ HÌNH PHÂN QUYỀN

Permission Model chính thức sẽ được định nghĩa trong:

01_ARCHITECTURE/PERMISSION_MODEL.md

Nguyên tắc:

User
 ↓
Membership
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

Không xây Permission như một tính năng phụ.

Permission là Core Architecture.

17. MODULE MAP — BẢN ĐỒ MODULE

Module Map chính thức sẽ được định nghĩa trong:

01_ARCHITECTURE/MODULE_MAP.md

Mục tiêu là đảm bảo:

không trùng chức năng;
không trùng dữ liệu;
không tạo module rác;
không tạo dependency vòng;
không xây lại Core nhiều lần.
18. TECHNICAL ARCHITECTURE — KIẾN TRÚC KỸ THUẬT

Technical Architecture sẽ xác định:

Frontend;
Backend;
Database;
Storage;
Authentication;
Hosting;
Deployment;
Backup;
Monitoring;
Security;
APIs;
Infrastructure.

File:

01_ARCHITECTURE/TECHNICAL_ARCHITECTURE.md

Chúng ta chưa quyết định mọi công nghệ chỉ vì công nghệ đó đang phổ biến.

Technology phải phục vụ Architecture.

19. DAILY WORK PROTOCOL — QUY TRÌNH MỖI NGÀY

Mỗi phiên làm việc với AI nên bắt đầu bằng:

1. Đọc START_HERE.md

2. Đọc MASTER_BLUEPRINT.md

3. Đọc AI_BUILD_RULES.md

4. Đọc Architecture Document liên quan

5. Kiểm tra Git Status

6. Xác định Current Stage

7. Xác định Current Task

8. Xác định Dependencies

9. Xác định Impact

10. Sau đó mới bắt đầu thay đổi

Không bắt đầu code ngay khi chưa biết mình đang đứng ở đâu trong Architecture.

20. AI SESSION PROMPT — LỆNH KHỞI ĐỘNG CHO AI

Khi bắt đầu một phiên làm việc mới, có thể dùng:

Tôi đang tiếp tục xây dựng SAOVN-OS.

Hãy đọc:

START_HERE.md
00_CONSTITUTION/MASTER_BLUEPRINT.md
00_CONSTITUTION/AI_BUILD_RULES.md
Các Architecture Documents liên quan

Sau đó:

xác định trạng thái hiện tại;
xác định chúng ta đang ở tầng nào;
xác định những gì đã hoàn thành;
xác định những gì chưa hoàn thành;
kiểm tra dependency;
kiểm tra xem nhiệm vụ tôi yêu cầu có phá vỡ Architecture hiện tại không;
chỉ sau đó mới đề xuất hoặc thực hiện bước tiếp theo.

Không tự ý bỏ qua Architecture.

Không tự ý tạo cấu trúc mới nếu chưa kiểm tra cấu trúc hiện tại.

Không lược bỏ thành phần quan trọng chỉ vì hiện tại chưa triển khai.

Hãy ưu tiên kiến trúc đầy đủ, modular và có khả năng mở rộng.

21. DAILY DEVELOPMENT RULE — QUY TẮC LÀM VIỆC VỚI AI

AI phải:

đọc tài liệu trước;
hiểu Context trước;
kiểm tra Dependency;
kiểm tra Permission;
kiểm tra Data Ownership;
kiểm tra Security;
kiểm tra tác động đến Core;
giải thích thay đổi quan trọng;
cập nhật Documentation khi Architecture thay đổi.

AI không được:

tự ý phá Core;
tự ý tạo Database mới cho cùng một Entity;
tự ý tạo Permission System riêng;
tự ý tạo Authentication riêng;
tự ý tạo Organization Model riêng;
hard-code Secrets;
bỏ qua Audit đối với hành động quan trọng;
đưa AI trở thành dependency bắt buộc.
22. GIT RULE — QUY TẮC GIT

Git là:

VERSION CONTROL + ARCHITECTURAL MEMORY

Mỗi thay đổi quan trọng phải có Commit rõ ràng.

Commit message phải mô tả thay đổi.

Ví dụ:

Define SAOVN-OS foundation architecture
Define domain model
Define permission architecture
Implement identity core
Implement organization core

Không dùng Git chỉ như nơi lưu file.

Git là lịch sử tiến hóa của hệ thống.

23. CHANGE DISCIPLINE — KỶ LUẬT THAY ĐỔI

Trước khi thay đổi Architecture:

Understand
 ↓
Evaluate
 ↓
Decide
 ↓
Document
 ↓
Implement
 ↓
Test

Không:

Code first
Think later
24. CURRENT ROADMAP — LỘ TRÌNH HIỆN TẠI
FOUNDATION
│
├── Constitution                 ✅
├── Build Rules                  ✅
├── System Architecture         ✅
│
├── Domain Model                 ⏳
├── Data Model                   ⏳
├── Permission Model             ⏳
├── Module Map                   ⏳
├── Integration Architecture    ⏳
└── Technical Architecture      ⏳
        │
        ▼
CORE
│
├── Identity
├── Organization
├── Membership
├── Roles
├── Permissions
├── Audit
├── Notification
├── Files
├── Search
└── Events
        │
        ▼
WORK PLATFORM
│
├── Goals
├── Tasks
├── Projects
├── Workflow
└── Approvals
        │
        ▼
KNOWLEDGE
│
├── Documents
├── Wiki
├── SOP
└── Knowledge Base
        │
        ▼
INTELLIGENCE
│
├── Metrics
├── KPI
├── Reports
└── Executive Dashboard
        │
        ▼
BUSINESS MODULES
│
├── HR
├── Finance
├── CRM
├── Sales
├── Marketing
├── Operations
└── Future Domains
        │
        ▼
AI EXTENSION
│
├── AI Gateway
├── Context
├── Tools
├── Model Router
└── AI Providers
25. WHAT WE DO NOT DO YET — NHỮNG VIỆC CHƯA LÀM

Ở giai đoạn Foundation Architecture:

Không vội:

xây toàn bộ UI;
xây Dashboard đẹp;
tích hợp AI;
xây Mobile App;
xây hàng chục Business Modules;
mua hạ tầng đắt tiền;
tối ưu scale quá sớm.

Ưu tiên:

Xây đúng nền móng trước.

26. NEXT STEP — BƯỚC TIẾP THEO

Sau khi START_HERE.md được hoàn thiện và Commit:

Bước tiếp theo là:

DOMAIN_MODEL.md

Mục tiêu:

Định nghĩa chính xác toàn bộ các thực thể tồn tại trong thế giới SAOVN-OS và mối quan hệ giữa chúng.

Sau đó:

DATA_MODEL.md

Sau đó:

PERMISSION_MODEL.md

Sau đó:

MODULE_MAP.md

Sau đó:

INTEGRATION_ARCHITECTURE.md

Sau đó:

TECHNICAL_ARCHITECTURE.md

Sau khi nền tảng đủ chắc:

CORE IMPLEMENTATION
27. FINAL PRINCIPLE — NGUYÊN TẮC CUỐI CÙNG

SAOVN-OS được xây dựng:

Không phải để trở thành một sản phẩm đẹp.

Mà để trở thành:

MỘT HỆ THỐNG LÀM VIỆC THẬT.

Không phải:

Nhiều tính năng.

Mà là:

Đúng cấu trúc.

Không phải:

AI làm tất cả.

Mà là:

Dữ liệu + Quy trình + Con người + Hệ thống + AI khi cần.

Không phải:

Xây thật nhanh.

Mà là:

Xây đúng để sau này không phải đập đi xây lại.

28. PROJECT NORTH STAR — NGÔI SAO BẮC ĐẨU

Mọi quyết định xây dựng SAOVN-OS phải hướng về một câu hỏi:

"Điều này có giúp SAOVN vận hành một tổ chức thực tế tốt hơn, minh bạch hơn, có hệ thống hơn và có khả năng mở rộng hơn hay không?"

Nếu có:

Xây.

Nếu chưa rõ:

Nghiên cứu.

Nếu phá Core:

Dừng lại và thiết kế lại.

END
HẾT START HERE