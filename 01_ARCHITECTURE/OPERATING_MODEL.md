# SAOVN-OS — OPERATING MODEL

## 1. Mục tiêu

SAOVN-OS sử dụng **một Application Shell chung cho toàn bộ người dùng**. Founder, lãnh đạo, quản lý, nhân viên, thực tập sinh và cộng tác viên không dùng các ứng dụng nghiệp vụ khác nhau chỉ vì khác vai trò.

Khác biệt giữa người dùng được quyết định bởi:

`Identity → Membership → Role → Scope → Capability → Data`

UI chỉ phản ánh capability và dữ liệu được cấp. UI không phải nguồn quyết định quyền.

## 2. Hai mặt của hệ thống

### Experience Plane

Một giao diện chung cho người dùng công ty:

- Dashboard
- Work
- Projects
- Goals
- Communication
- Documents
- Knowledge
- Attendance
- Notifications
- Search

Cùng module, cùng component, cùng navigation engine. Người dùng chỉ thấy chức năng phù hợp với capability của mình.

### Control Plane

Admin vận hành hậu phương:

- Identity & accounts
- Organization structure
- Membership
- Roles
- Permissions
- Scopes
- Module configuration
- Workflow configuration
- System configuration
- Audit
- Feature/capability policy

Control Plane thay đổi **state/policy**, không sửa trực tiếp HTML/JS của người dùng.

## 3. Quy tắc bất biến

1. Không tạo `Admin Work`, `Member Work`, `Manager Work` thành các module nghiệp vụ riêng.
2. Không để module tự định nghĩa User/Member/Role/Permission riêng.
3. Frontend không phải authority về security.
4. Backend/Firestore Rules là enforcement cuối cùng.
5. Một capability có một tên chuẩn.
6. Scope được resolve tập trung, không tự viết lại ở từng module.
7. Module chỉ đọc Core Contract và API của module khác; không đọc nội bộ của module khác.
8. Admin thay đổi policy/configuration thì Application Shell phản ánh thay đổi ở runtime.
9. Tắt một module không được làm hỏng Shell hoặc module sibling.
10. AI không phải dependency của Core.

## 4. Capability model

Capability có dạng:

`<domain>.<resource>.<action>`

Ví dụ:

- `work.task.view`
- `work.task.create`
- `work.task.update`
- `work.task.assign`
- `work.task.approve`
- `project.view`
- `people.member.view`
- `people.member.manage`
- `admin.policy.manage`

Role không được hard-code trực tiếp vào UI. Role cấp capability thông qua policy.

## 5. Scope model

Scope chuẩn:

- `SELF`
- `TEAM`
- `DEPARTMENT`
- `COMPANY`
- `GROUP`
- `PROJECT`
- `GLOBAL`

Một capability luôn được đánh giá cùng scope.

Ví dụ:

`work.task.update + TEAM`

không đồng nghĩa với:

`work.task.update + GLOBAL`.

## 6. Runtime flow

```text
AUTH
 ↓
IDENTITY
 ↓
ACTIVE MEMBERSHIP
 ↓
ROLE + POLICY
 ↓
SCOPE RESOLUTION
 ↓
CAPABILITY SET
 ↓
APPLICATION SHELL
 ↓
MODULES
 ↓
DATA
```

## 7. Security flow

```text
UI capability check
        ↓
Application service
        ↓
Backend/data access
        ↓
Server/Firestore authorization
        ↓
Audit
```

UI check chỉ nhằm UX. Security check phải tồn tại ở backend/data boundary.

## 8. Admin change propagation

```text
Admin Control Plane
        ↓
Policy / Configuration state
        ↓
Version + updatedAt
        ↓
Runtime bootstrap / subscription
        ↓
Capability resolver
        ↓
Navigation + module state + action guards
```

Không dùng cách admin ghi code frontend.

## 9. Module contract

Mỗi module phải cung cấp:

- `manifest`
- `routes`
- `navigation`
- `capabilities`
- `scope resolver`
- `data adapters`
- `events`
- `audit actions`
- `health check`

Module không được truy cập DOM hoặc state nội bộ của module khác.

## 10. Definition of Done

Một module chỉ được coi là hoàn thành khi:

- chạy được trong Application Shell chung;
- không có fork UI theo role;
- capability được khai báo tập trung;
- scope được xác định rõ;
- data access khớp permission contract;
- backend/data rules enforce cùng policy;
- audit action quan trọng;
- module có thể bật/tắt độc lập;
- lỗi module không làm chết Shell hoặc sibling module;
- có regression cho ít nhất một user thường và một user quản lý.
