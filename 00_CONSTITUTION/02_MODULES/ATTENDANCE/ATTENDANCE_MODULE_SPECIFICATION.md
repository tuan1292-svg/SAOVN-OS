# SAOVN-OS — ATTENDANCE MODULE SPECIFICATION
# MODULE CHẤM CÔNG / ĐIỂM DANH TRUY CẬP HỆ THỐNG

> Status: Design checkpoint
> Owner: SAOVN-OS
> Module: PEOPLE / Attendance
> Priority: P0 — Core operational capability

---

# 01. PURPOSE — MỤC ĐÍCH

Attendance Module ghi nhận việc thành viên có truy cập và hoạt động trên SAOVN-OS hay không.

Giai đoạn đầu của module **không phải hệ thống tính lương** và không tự suy diễn số giờ làm việc thực tế chỉ từ việc mở website.

Mục tiêu trước mắt:

```text
Ai đã truy cập hệ thống?
Khi nào truy cập?
Phiên truy cập còn hoạt động không?
Lần hoạt động cuối là khi nào?
Hôm nay thành viên đã vào hệ thống chưa?
```

---

# 02. ARCHITECTURAL POSITION — VỊ TRÍ TRONG KIẾN TRÚC

Theo Module Map, Attendance thuộc:

```text
PEOPLE
└── Attendance
```

Attendance phụ thuộc vào các Core Module:

```text
Identity
Organization
Access Control
Audit
```

Attendance không tạo Identity riêng và không tạo bản sao hồ sơ thành viên.

Identity chính vẫn lấy từ Identity / Membership hiện có.

---

# 03. DOMAIN CONCEPTS — KHÁI NIỆM NGHIỆP VỤ

## 03.1 System Access — Lần truy cập hệ thống

Một sự kiện cho biết User đã xác thực và bắt đầu sử dụng SAOVN-OS.

Ví dụ:

```text
User A
→ Login thành công
→ System Access
→ 2026-08-17 08:03
```

## 03.2 Access Session — Phiên truy cập

Một phiên làm việc của User sau khi đăng nhập.

Session dùng để xác định:

- thời điểm bắt đầu;
- hoạt động gần nhất;
- trạng thái phiên;
- thời điểm kết thúc nếu xác định được.

## 03.3 Presence — Trạng thái hoạt động

Presence chỉ phản ánh trạng thái hoạt động gần đây trên hệ thống.

```text
ACTIVE
IDLE
OFFLINE
```

Presence **không đồng nghĩa** với chấm công đủ giờ.

## 03.4 Attendance Day — Ngày điểm danh

Một bản tổng hợp theo ngày cho biết User có truy cập hệ thống trong ngày đó hay không.

Giai đoạn đầu chỉ cần:

```text
hasAccess
firstAccessAt
lastAccessAt
```

Không tự tính `workingHours` nếu chưa có chính sách chấm công chính thức.

---

# 04. DATA OWNERSHIP — SỞ HỮU DỮ LIỆU

Attendance sở hữu các dữ liệu:

```text
Access Event
Access Session
Attendance Day
```

Attendance tham chiếu:

```text
User / Identity
Membership
Organization
Department
Team
```

Không copy toàn bộ Profile vào Attendance.

Có thể lưu snapshot tối thiểu cho audit khi cần, nhưng Identity hiện tại vẫn là nguồn hiển thị chuẩn.

---

# 05. INITIAL DATA MODEL — MÔ HÌNH DỮ LIỆU GIAI ĐOẠN 1

## 05.1 `attendanceSessions`

Đề xuất collection:

```text
/attendanceSessions/{sessionId}
```

Fields:

```text
userId
organizationId
membershipId
startedAt
lastActiveAt
endedAt
status
source
createdAt
updatedAt
```

`status`:

```text
ACTIVE
ENDED
EXPIRED
```

`source` có thể dùng để phân biệt:

```text
WEB
OTHER
```

nhưng không được hard-code logic phụ thuộc vào một client duy nhất.

## 05.2 `attendanceDays`

Đề xuất collection:

```text
/attendanceDays/{attendanceId}
```

Fields:

```text
userId
organizationId
membershipId
date
hasAccess
firstAccessAt
lastAccessAt
sessionCount
createdAt
updatedAt
```

Document ID nên có tính xác định theo User + Organization + Date để tránh tạo nhiều bản ghi cho cùng một người trong cùng một ngày.

Ví dụ:

```text
{organizationId}_{userId}_{YYYY-MM-DD}
```

Nếu triển khai Firestore, cần chuẩn hóa cách tạo ID để client và server dùng cùng một quy tắc.

---

# 06. EVENT FLOW — LUỒNG HOẠT ĐỘNG

```text
Authentication success
        ↓
Resolve Identity / Membership
        ↓
Create or resume Access Session
        ↓
Update Attendance Day
        ↓
Update lastActiveAt on controlled interval
        ↓
Session ends / expires
```

Không ghi Firestore ở mỗi thao tác click.

`lastActiveAt` phải được cập nhật theo khoảng thời gian hợp lý để tránh tạo write quá lớn.

---

# 07. FIRST VERSION BEHAVIOR — HÀNH VI PHIÊN BẢN ĐẦU

Khi User đăng nhập thành công:

```text
1. Xác định User UID.
2. Resolve Membership active.
3. Mở hoặc tạo Access Session.
4. Tạo/cập nhật Attendance Day của ngày hiện tại.
5. Ghi firstAccessAt nếu đây là lần đầu trong ngày.
6. Cập nhật lastAccessAt.
```

Trong phiên đang hoạt động:

```text
Không ghi liên tục.
Chỉ heartbeat theo chu kỳ.
```

Khi logout:

```text
endedAt = current time
status = ENDED
```

Nếu browser đóng hoặc mất kết nối:

```text
không giả định logout thành công.
Session được coi là EXPIRED sau ngưỡng timeout.
```

---

# 08. PERMISSION MODEL — PHÂN QUYỀN

## Member

Được phép:

```text
Tạo/cập nhật phiên của chính mình
Cập nhật heartbeat của chính mình
Xem trạng thái truy cập của chính mình
```

Không được phép:

```text
Ghi attendance cho User khác
Sửa firstAccessAt của User khác
Sửa lastAccessAt của User khác
Sửa session của User khác
```

## Department Head / Team Lead

Giai đoạn đầu không tự động được quyền sửa attendance của thành viên.

Có thể được cấp quyền **xem báo cáo theo Scope** ở checkpoint sau.

## Admin / Founder

Được phép:

```text
Xem attendance theo phạm vi quản trị
Xem session status
Xem first/last access
```

Việc sửa dữ liệu attendance lịch sử phải đi qua cơ chế Audit/Adjustment riêng, không cho Admin tùy tiện ghi đè dữ liệu gốc.

---

# 09. SECURITY PRINCIPLES — NGUYÊN TẮC BẢO MẬT

Attendance là dữ liệu hoạt động nhân sự nên phải tuân thủ:

```text
Least privilege
Single source of truth
Auditability
Scope-based visibility
No client-side trust
```

Không được coi:

```text
request.auth != null
```

là đủ để cho phép User ghi attendance của người khác.

Firestore Rules phải kiểm tra User hiện tại khớp với `userId` của session/day record.

---

# 10. ADMIN VIEW — GIAO DIỆN QUẢN TRỊ GIAI ĐOẠN 1

Dashboard tối thiểu:

```text
ĐIỂM DANH HỆ THỐNG

Tổng thành viên
Đã truy cập hôm nay
Chưa truy cập
Đang hoạt động
Đã rời hệ thống
```

Danh sách:

```text
Thành viên
Phòng ban
Team
Lần truy cập đầu
Lần hoạt động cuối
Trạng thái
```

Identity hiển thị:

```text
Họ tên
Chức danh
```

Không lấy email làm tên chính.

---

# 11. MEMBER VIEW — GIAO DIỆN THÀNH VIÊN

Thành viên chỉ cần thấy:

```text
Hôm nay
Đã truy cập: Có / Chưa
Lần vào hệ thống
Hoạt động gần nhất
Trạng thái phiên
```

Không cần biến Attendance thành màn hình chấm công phức tạp ở giai đoạn đầu.

---

# 12. FUTURE EXTENSIONS — MỞ RỘNG SAU

Attendance có thể mở rộng thành:

```text
Work Schedule
Shift
Check-in / Check-out
Remote Work
Leave
Overtime
Attendance Adjustment
Approval
Attendance Report
Payroll Integration
```

Các chức năng này **không nằm trong checkpoint đầu tiên**.

Đặc biệt:

```text
Có truy cập hệ thống
≠
Đã làm đủ số giờ
```

SAOVN-OS chỉ được tính giờ làm khi có chính sách và cơ chế chấm công rõ ràng.

---

# 13. IMPLEMENTATION CHECKPOINTS — CHECKPOINT TRIỂN KHAI

```text
CHECKPOINT 1
Data model + collection contract

CHECKPOINT 2
Firestore Rules

CHECKPOINT 3
Login → Attendance Session

CHECKPOINT 4
Heartbeat / lastActiveAt

CHECKPOINT 5
Attendance Day

CHECKPOINT 6
Admin attendance dashboard

CHECKPOINT 7
Member attendance view

CHECKPOINT 8
Admin + Member security test

CHECKPOINT 9
Commit / close checkpoint
```

Không triển khai toàn bộ module trong một commit lớn.

---

# 14. SUCCESS CRITERIA — TIÊU CHÍ HOÀN THÀNH GIAI ĐOẠN 1

Module được coi là đạt checkpoint khi:

```text
✓ Member login → được ghi nhận truy cập.
✓ Cùng một ngày không tạo attendance day trùng.
✓ Session được tạo/resume đúng.
✓ Heartbeat không tạo write liên tục.
✓ Member không ghi/sửa dữ liệu của Member khác.
✓ Admin xem được dữ liệu theo quyền.
✓ Identity hiển thị đúng Họ tên + Chức danh.
✓ Session timeout không bị coi là logout giả.
✓ Dữ liệu có timestamp rõ ràng.
✓ Có thể truy vết thay đổi quan trọng.
```

---

# END OF ATTENDANCE MODULE SPECIFICATION
