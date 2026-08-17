# SAOVN-OS — PROJECT STATE

> Chốt sổ: 17/08/2026

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
- Mỗi thay đổi lớn nên có commit riêng để Admin và Member có thể test độc lập.
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
MANAGEMENT SCOPE RECOGNITION  COMPLETE FOR CURRENT PROTOTYPE
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
✓ Không hiển thị trạng thái “Chưa có phòng ban” khi đã có department
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
✓ Hiển thị đồng nghiệp cùng phòng/team ở phía Member
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

Đã xây dựng:

```text
✓ My Work
✓ Tasks
✓ Assignments
✓ Deadlines
✓ Progress
✓ Status / Kanban tiếng Việt
✓ Comments / Trao đổi
✓ Checklist
✓ Activity
✓ Mentions, gồm @tất cả thành viên
✓ Notifications integration foundation
✓ Thành viên tham gia có thể click để mở profile popup
✓ Danh sách người phụ trách nhiều thành viên
✓ Department / Team scope filtering
✓ Member personal / assigned Work loading
✓ Admin Work management
✓ Member Work view
```

Work Identity luôn dùng Họ tên + Chức danh.

### Work permission checkpoint hiện tại

```text
Admin → Work: đang hoạt động.
Member → Work được giao: Work hiển thị đúng phạm vi.
Member → kéo Kanban: CHƯA ĐÓNG CHECKPOINT.
```

Hiện tại thành viên vẫn gặp:

```text
FirebaseError: Missing or insufficient permissions.
```

khi cập nhật trạng thái Kanban. Console cũng từng ghi nhận permission-denied ở Work memberships / analytics. Đây là **known issue chưa hoàn thành**, không đánh dấu Work security COMPLETE.

Hai commit xử lý Work gần nhất trong checkpoint này:

```text
06e075bd  fix: chuẩn hóa quyền kéo thả Work theo người được giao
1abfe4a9  fix: cho phép thành viên được giao cập nhật Work an toàn
```

Các commit trên đã được giữ lại để tiếp tục debug có kiểm soát, không rollback lan sang giao diện đã hoàn thiện.

---

## 12. Communication / Notifications Foundation

Đã có nền tảng cho:

```text
✓ Chat / Conversations
✓ Tin nhắn
✓ Unread count
✓ Notifications
✓ Notification badge
✓ Read / unread state
✓ Mention notification
✓ @tất cả thành viên
```

Các vấn đề trước đây về unread badge, permission và conversation indexing đã được xử lý ở các checkpoint trước. Khi tiếp tục phát triển cần giữ nguyên hành vi đã chốt, không làm mất số chưa đọc khi refresh hoặc khi mở nội dung.

---

## 13. Known Recent Fixes

```text
c9b8b11  fix: prevent department workspace task overflow
941ca84  feat: enforce department head work scope
fab358b  fix: resolve department head and team lead scope
43c12b9  fix: align department workspace tasks with scope
1442162  fix: allow members directory reads without admin permission
52c3b31  fix: polish member team field and detail inputs
06e075bd fix: chuẩn hóa quyền kéo thả Work theo người được giao
1abfe4a9 fix: cho phép thành viên được giao cập nhật Work an toàn
```

Các commit trên repo là Source of Truth; nếu local khác repo thì pull `main` trước khi làm tiếp.

---

## 14. Current Checkpoint — 17/08/2026

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
Member directory access
Team field UI polish
Department Workspace task overflow fix
Work UI / Kanban UI
Work assignment UI
Work comments / checklist / mentions foundation
Chat / notification foundation
```

### NOT YET CLOSED

```text
Member → assigned Work → Kanban status update
Scope → Work security verification
Firestore Rules verification against real Admin + Member accounts
```

**Không rollback giao diện hoặc các module đã hoàn thiện chỉ vì lỗi permission của Work.**

---

## 15. NEXT DEVELOPMENT — CHẤM CÔNG / ĐIỂM DANH TRUY CẬP HỆ THỐNG

Đây là checkpoint phát triển tiếp theo sau khi chốt State hôm nay.

Mục tiêu ban đầu:

```text
SYSTEM ATTENDANCE / ACCESS PRESENCE
│
├── Ghi nhận lần đăng nhập thành công
├── Ghi nhận thời điểm truy cập
├── Ghi nhận lần hoạt động cuối
├── Xác định trạng thái đang hoạt động / đã rời
├── Theo dõi lịch sử truy cập theo ngày
└── Dashboard Admin xem tình hình truy cập của thành viên
```

### Phân biệt rõ

```text
ĐĂNG NHẬP
= xác thực tài khoản thành công

TRUY CẬP HỆ THỐNG
= có phiên làm việc / có hoạt động trong hệ thống

ĐIỂM DANH
= trạng thái được ghi nhận theo quy tắc chấm công của tổ chức
```

Không được mặc định rằng “đăng nhập một lần = làm việc cả ngày”.

### Thiết kế dữ liệu mục tiêu

Có thể dùng một lớp attendance/access riêng, không trộn trực tiếp vào Identity:

```text
/systemAccess/{recordId}

userId
identitySnapshot
loginAt
lastActiveAt
logoutAt
sessionId
status
createdAt
updatedAt
```

Nếu sau khi thiết kế chi tiết thấy session nên tách riêng với daily attendance thì sẽ tách thành hai collection. **Chưa coi schema này là final trước khi rà lại Constitution / Data Model.**

### Admin cần nhìn thấy

```text
Thành viên
Trạng thái hôm nay
Lần truy cập đầu
Lần hoạt động cuối
Tổng phiên / lịch sử
```

Mục tiêu giao diện có thể tiến tới:

```text
🟢 Đang hoạt động
🟡 Đã truy cập hôm nay
⚪ Chưa truy cập hôm nay
```

Không dùng dữ liệu presence để kết luận hiệu suất làm việc. Presence chỉ phản ánh truy cập / hoạt động hệ thống.

---

## 16. Development Sequence From Here

```text
CURRENT CHECKPOINT
  ↓
1. Chốt PROJECT_STATE
  ↓
2. Rà Constitution + Data Model cho Attendance
  ↓
3. Thiết kế System Access / Attendance data model
  ↓
4. Firestore Rules cho access records
  ↓
5. Ghi nhận login / session
  ↓
6. Cập nhật lastActiveAt
  ↓
7. Xử lý logout / session expiry
  ↓
8. Admin attendance dashboard
  ↓
9. Test Admin + Member
  ↓
10. Chốt checkpoint Attendance
  ↓
11. Quay lại đóng Work permission checkpoint
```

Không làm Attendance bằng cách sửa trực tiếp các module Work hiện tại.

---

## 17. Next Session Command

```powershell
cd C:\Users\Admin\Desktop\SAOVN-OS
git pull origin main
git status
git log -5 --oneline
```

Nếu Rules đã thay đổi nhưng chưa deploy:

```powershell
firebase deploy --only firestore:rules
```

---

# END OF PROJECT STATE
