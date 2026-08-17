# SAOVN-OS — ATTENDANCE DATA MODEL
# MÔ HÌNH DỮ LIỆU CHẤM CÔNG / ĐIỂM DANH

> Status: Design checkpoint 2
> Module: PEOPLE / Attendance
> Scope: System access presence only

---

## 01. COLLECTIONS

### `attendanceSessions`

```text
/attendanceSessions/{sessionId}
```

Một document đại diện cho một phiên truy cập của một thành viên.

Fields chuẩn:

```text
userId: string
organizationId: string
membershipId: string
startedAt: timestamp
lastActiveAt: timestamp
endedAt: timestamp | null
status: "ACTIVE" | "ENDED" | "EXPIRED"
source: "WEB" | "OTHER"
createdAt: timestamp
updatedAt: timestamp
```

### `attendanceDays`

```text
/attendanceDays/{attendanceId}
```

Một document đại diện cho tổng hợp truy cập của một thành viên trong một ngày.

Fields chuẩn:

```text
userId: string
organizationId: string
membershipId: string
date: string
hasAccess: boolean
firstAccessAt: timestamp
lastAccessAt: timestamp
sessionCount: number
createdAt: timestamp
updatedAt: timestamp
```

---

## 02. DETERMINISTIC ATTENDANCE ID

Attendance day phải có ID xác định theo:

```text
{organizationId}_{userId}_{YYYY-MM-DD}
```

Mục đích:

```text
1 User
1 Organization
1 Day
= 1 Attendance Day
```

Không dùng `addDoc()` cho `attendanceDays`, tránh tạo bản ghi trùng.

Nếu UID hoặc organizationId có ký tự không phù hợp với convention nội bộ, implementation phải encode/normalize thống nhất ở một helper duy nhất.

---

## 03. SESSION ID

`attendanceSessions` dùng ID ngẫu nhiên hoặc ID do client tạo an toàn.

Không dùng `userId` làm document ID vì một User có thể có nhiều session trong các thời điểm khác nhau.

Client không được tự quyết định quyền của session bằng cách thay đổi `userId` sau khi tạo.

---

## 04. SOURCE OF TRUTH

Attendance không copy profile.

Nguồn chuẩn:

```text
userId
  ↓
Identity
  ↓
Membership
  ↓
Organization / Department / Team
```

Khi hiển thị tên thành viên:

```text
Identity.displayName
```

Khi hiển thị phòng ban/team:

```text
Membership / Organization structure
```

Không lưu tên thành viên như một field bắt buộc trong attendance để tránh dữ liệu cũ bị sai khi đổi tên.

---

## 05. WRITE CONTRACT

### Login success

Được phép tạo hoặc resume:

```text
attendanceSessions
attendanceDays
```

### Heartbeat

Chỉ được cập nhật session của chính User.

Heartbeat tối thiểu cập nhật:

```text
lastActiveAt
updatedAt
```

Không tạo session mới mỗi heartbeat.

### Logout

Chỉ cập nhật session của chính User:

```text
endedAt
status = ENDED
updatedAt
```

### Timeout

Nếu không có heartbeat trong khoảng timeout đã quy định:

```text
status = EXPIRED
```

Việc đánh dấu EXPIRED nên do cơ chế server/administrative process xử lý khi có đủ infrastructure; client không được tùy tiện đánh dấu session của User khác.

---

## 06. ATTENDANCE DAY UPDATE RULE

Khi có access thành công:

```text
hasAccess = true
```

Nếu lần đầu trong ngày:

```text
firstAccessAt = now
```

Mỗi access/session hợp lệ:

```text
lastAccessAt = now
sessionCount += 1
```

Heartbeat **không tăng `sessionCount`**.

`lastAccessAt` của day có thể được cập nhật theo heartbeat đã kiểm soát để phản ánh hoạt động gần nhất.

---

## 07. TIME POLICY

Tất cả timestamp nghiệp vụ phải dùng Firestore server timestamp khi có thể.

`date` là ngày nghiệp vụ theo timezone chính thức của Organization.

Không lấy timezone của trình duyệt làm nguồn chính cho ngày điểm danh nếu SAOVN-OS đã có organization timezone.

Nếu hiện tại chưa có organization timezone trong model, implementation checkpoint đầu phải dùng một constant cấu hình tập trung, không rải timezone khắp code.

---

## 08. MEMBER OVERVIEW — VỊ TRÍ HIỂN THỊ

Attendance của chính thành viên sẽ được đưa lên **Trang Tổng quan** của thành viên, không tạo thêm một menu riêng ở giai đoạn đầu.

Khu vực đề xuất:

```text
TỔNG QUAN
├── Chào thành viên
├── Chỉ số công việc
├── Thông báo / Tin nhắn
└── THẺ ĐIỂM DANH HỆ THỐNG
```

Thẻ phải cho thành viên nhìn ngay được:

```text
HÔM NAY

● Đã truy cập hệ thống

Lần vào:       08:03
Hoạt động cuối: 20:41
Phiên hiện tại: Đang hoạt động
```

Nếu chưa truy cập:

```text
HÔM NAY

○ Chưa truy cập hệ thống
```

Thông điệp UI mang tính tự nhận thức, không dùng để hạ nhục hoặc gây áp lực:

```text
Hôm nay bạn đã có mặt trên hệ thống.
Hãy giữ nhịp làm việc tốt nhé.
```

Không hiển thị bảng xếp hạng thành viên ở Member Overview trong checkpoint đầu.

---

## 09. ADMIN OVERVIEW — VỊ TRÍ HIỂN THỊ

Admin sẽ có một **khối Điểm danh hệ thống** trên Tổng quan Admin.

Tóm tắt:

```text
TỔNG THÀNH VIÊN
ĐÃ TRUY CẬP HÔM NAY
CHƯA TRUY CẬP
ĐANG HOẠT ĐỘNG
```

Bên dưới là bảng:

```text
Thành viên | Phòng ban | Team | Lần vào | Hoạt động cuối | Trạng thái
```

Tên thành viên phải dùng Identity hiện tại và có thể tái sử dụng profile popup/link đã có trong hệ thống.

---

## 10. INDEX / QUERY REQUIREMENTS

Các query dự kiến:

### Member

```text
attendanceDays
where userId == currentUser.uid
where date == today
```

### Admin

Theo organization và date:

```text
attendanceDays
where organizationId == currentOrganizationId
where date == today
```

### Active sessions

```text
attendanceSessions
where organizationId == currentOrganizationId
where status == ACTIVE
```

Nếu Firestore yêu cầu composite index, index phải được ghi vào `firestore.indexes.json` thay vì tạo thủ công ngoài repo.

---

## 11. SECURITY CONTRACT

Member chỉ được đọc/ghi record có:

```text
userId == request.auth.uid
```

Admin read scope phải dựa trên permission hiện có của Organization/Access Control.

Không dùng:

```text
request.auth != null
```

làm điều kiện duy nhất cho attendance write.

Không cho client tự thay đổi:

```text
userId
organizationId
membershipId
firstAccessAt
createdAt
```

sau khi record đã được tạo.

---

## 12. IMPLEMENTATION ORDER

```text
1. Attendance helper / data contract
2. Firestore Rules
3. Login success hook
4. Session resume/create
5. Attendance Day upsert
6. Heartbeat
7. Member Overview card
8. Admin Overview summary/table
9. Indexes
10. Security test
```

---

# END OF ATTENDANCE DATA MODEL
