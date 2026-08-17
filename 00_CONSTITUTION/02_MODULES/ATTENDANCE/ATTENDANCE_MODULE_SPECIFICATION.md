# SAOVN-OS — ATTENDANCE MODULE SPECIFICATION
# MODULE CHẤM CÔNG / ĐIỂM DANH TRUY CẬP HỆ THỐNG

> Status: Design checkpoint
> Owner: SAOVN-OS
> Module: PEOPLE / Attendance
> Priority: P0 — Core operational capability

# 01. PURPOSE — MỤC ĐÍCH

Attendance Module ghi nhận việc thành viên có truy cập và hoạt động trên SAOVN-OS hay không.

Giai đoạn đầu không phải hệ thống tính lương và không tự suy diễn số giờ làm việc thực tế chỉ từ việc mở website.

Mục tiêu:
- Ai đã truy cập hệ thống?
- Khi nào truy cập?
- Phiên truy cập còn hoạt động không?
- Lần hoạt động cuối là khi nào?
- Hôm nay thành viên đã vào hệ thống chưa?
- Thành viên đang đứng ở đâu trong bảng điểm danh của tập thể?

# 02. ARCHITECTURAL POSITION

Attendance thuộc PEOPLE và phụ thuộc Identity, Organization, Access Control, Audit.

Attendance không tạo Identity riêng và không tạo bản sao hồ sơ thành viên.

# 03. DOMAIN CONCEPTS

## 03.1 System Access
Một sự kiện cho biết User đã xác thực và bắt đầu sử dụng SAOVN-OS.

## 03.2 Access Session
Một phiên làm việc sau khi đăng nhập, gồm startedAt, lastActiveAt, endedAt và status.

## 03.3 Presence
Trạng thái hoạt động gần đây: ACTIVE, IDLE, OFFLINE. Presence không đồng nghĩa với đủ giờ làm.

## 03.4 Attendance Day
Bản tổng hợp theo ngày: hasAccess, firstAccessAt, lastAccessAt, sessionCount.

## 03.5 Attendance Leaderboard
Bảng thành tích điểm danh của toàn tập thể. Đây là một phần chính thức của Attendance, không phải màn hình phụ.

Leaderboard phục vụ mục tiêu tạo động lực tích cực: thành viên nhìn thấy mức độ hiện diện của cả tập thể và tự nhận biết mình đang nghiêm túc đến đâu.

Giai đoạn đầu xếp hạng theo **độ đều đặn truy cập hệ thống**, không xếp hạng theo số giờ online.

Các chỉ số chính:
- Số ngày đã truy cập trong khoảng thời gian.
- Tỷ lệ điểm danh.
- Lần truy cập đầu gần nhất.
- Trạng thái hiện tại.

Không dùng leaderboard để kết luận năng suất hay chất lượng công việc.

# 04. DATA OWNERSHIP

Attendance sở hữu Access Event, Access Session, Attendance Day và các aggregate phục vụ leaderboard.

Attendance tham chiếu User / Identity, Membership, Organization, Department, Team.

Identity hiện tại vẫn là nguồn hiển thị chuẩn.

# 05. INITIAL DATA MODEL

## 05.1 attendanceSessions

/attendanceSessions/{sessionId}

Fields:
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

status: ACTIVE | ENDED | EXPIRED
source: WEB | OTHER

## 05.2 attendanceDays

/attendanceDays/{attendanceId}

Fields:
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

Document ID có tính xác định theo Organization + User + Date để tránh trùng ngày.

## 05.3 Leaderboard aggregate

Leaderboard có thể tính từ attendanceDays thay vì tạo một nguồn dữ liệu nhân sự thứ hai.

Nếu cần cache aggregate để dashboard nhanh hơn, cache phải có thể tái tạo từ attendanceDays.

Không lưu thứ hạng như một sự thật bất biến.

# 06. EVENT FLOW

Authentication success
→ Resolve Identity / Membership
→ Create or resume Access Session
→ Update Attendance Day
→ Heartbeat theo chu kỳ
→ Session ends / expires
→ Leaderboard aggregate được cập nhật/đọc từ Attendance Day

Không ghi Firestore ở mỗi click.

# 07. LEADERBOARD UX

## Member Dashboard

Ngay trên Tổng quan của thành viên có module:

```text
🏆 ĐIỂM DANH HỆ THỐNG

Hôm nay | Tuần này | Tháng này

🥇 Thành viên A   5/5 ngày   ● Đang hoạt động
🥈 Thành viên B   5/5 ngày   ● Đang hoạt động
🥉 Thành viên C   4/5 ngày   ○ Đã rời
4  Thành viên D   4/5 ngày   ● Đang hoạt động
...
```

Bảng hiển thị toàn bộ thành viên trong phạm vi tổ chức mà người xem được phép thấy.

Có thể lọc:
- Toàn công ty
- Phòng ban
- Team

Tên thành viên dùng Identity hiện tại và giữ khả năng mở profile theo chuẩn UI của hệ thống.

Không hiển thị email làm tên chính.

## Admin Dashboard

Admin có bảng quản trị chi tiết hơn:

- Tổng thành viên
- Đã truy cập hôm nay
- Chưa truy cập
- Đang hoạt động
- Đã rời hệ thống
- Danh sách thành viên
- Phòng ban
- Team
- Lần truy cập đầu
- Lần hoạt động cuối
- Trạng thái
- Tỷ lệ điểm danh

# 08. RANKING RULES

Giai đoạn đầu:

```text
attendanceRate = accessedWorkingDays / expectedWorkingDays
```

Nếu chưa có lịch làm việc chính thức, dùng số ngày trong khoảng được chọn làm mẫu thống kê, không tự gọi đó là số ngày làm việc bắt buộc.

Thứ hạng chỉ là chỉ báo mức độ hiện diện hệ thống.

Không xếp hạng theo:
- số phút online;
- số lần click;
- số lượng thao tác giả tạo;
- năng suất công việc.

# 09. PERMISSION MODEL

Member:
- tạo/cập nhật session của chính mình;
- heartbeat của chính mình;
- xem leaderboard trong scope được phép;
- xem attendance của chính mình.

Department Head / Team Lead:
- xem báo cáo theo Scope khi được cấp quyền;
- không tự động được quyền sửa attendance lịch sử.

Admin / Founder:
- xem attendance theo phạm vi quản trị;
- xem leaderboard toàn tổ chức;
- xem session status, first/last access.

Sửa dữ liệu lịch sử phải đi qua Audit/Adjustment riêng.

# 10. SECURITY PRINCIPLES

Least privilege
Single source of truth
Auditability
Scope-based visibility
No client-side trust

Không coi request.auth != null là đủ để ghi attendance của người khác.

Firestore Rules phải kiểm tra User hiện tại khớp với userId của session/day record.

# 11. FUTURE EXTENSIONS

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

Đặc biệt:

Có truy cập hệ thống ≠ Đã làm đủ số giờ.

# 12. IMPLEMENTATION CHECKPOINTS

CHECKPOINT 1 — Data model + collection contract
CHECKPOINT 2 — Firestore Rules
CHECKPOINT 3 — Login → Attendance Session
CHECKPOINT 4 — Heartbeat / lastActiveAt
CHECKPOINT 5 — Attendance Day
CHECKPOINT 6 — Leaderboard aggregate/query
CHECKPOINT 7 — Admin attendance dashboard
CHECKPOINT 8 — Member leaderboard on Overview
CHECKPOINT 9 — Admin + Member security test
CHECKPOINT 10 — Commit / close checkpoint

Không triển khai toàn bộ module trong một commit lớn.

# 13. SUCCESS CRITERIA

✓ Member login → được ghi nhận truy cập.
✓ Cùng một ngày không tạo attendance day trùng.
✓ Session được tạo/resume đúng.
✓ Heartbeat không tạo write liên tục.
✓ Member không ghi/sửa dữ liệu của Member khác.
✓ Admin xem được dữ liệu theo quyền.
✓ Member nhìn thấy leaderboard trong scope được phép.
✓ Leaderboard phản ánh toàn bộ thành viên trong scope.
✓ Thứ hạng dựa trên độ đều đặn truy cập, không giả định năng suất.
✓ Identity hiển thị đúng Họ tên + Chức danh.
✓ Session timeout không bị coi là logout giả.
✓ Dữ liệu có timestamp rõ ràng.
✓ Có thể truy vết thay đổi quan trọng.

# END OF ATTENDANCE MODULE SPECIFICATION
