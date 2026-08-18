# SAOVN-OS — MODULE SYSTEM SPECIFICATION

**Version:** 1.0  
**Status:** Architecture Standard  
**Scope:** Core + application modules + sub-modules

## 1. Mục tiêu

SAOVN-OS được xây theo mô hình **Plug-in Modules**: mỗi module là một boundary có định danh, dữ liệu, permission, UI và contract riêng. Module mới được "cắm" vào hệ thống thông qua contract; không được sửa nội bộ module khác chỉ để tích hợp.

Mục tiêu bắt buộc:

- thêm module không phá module đang PASS;
- permission của module mới không tự động mở rộng hoặc thu hẹp permission của module khác;
- dữ liệu có một owner duy nhất;
- liên kết giữa module dùng Contract / Service / Event, không truy cập tùy tiện vào implementation nội bộ;
- có thể bật/tắt hoặc rollback một module mà không làm hỏng phần còn lại.

## 2. Hierarchy

```text
SAOVN-OS
└── DOMAIN MODULE
    └── SUB-MODULE / PLUGIN
        └── CAPABILITY
```

Ví dụ:

```text
WORK
├── WORK.TASK
├── WORK.CHECKLIST
├── WORK.COMMENTS
├── WORK.MENTIONS
├── WORK.ANALYTICS
└── WORK.CHAT
```

`WORK.CHAT` là con của `WORK`, nhưng **không phải implementation của `WORK.CHECKLIST`**.

## 3. Module ID

Mỗi module phải có ID ổn định và duy nhất.

Quy ước:

```text
<DOMAIN>.<MODULE>[.<CAPABILITY>]
```

Ví dụ:

```text
WORK.TASK
WORK.CHECKLIST
WORK.COMMENTS
WORK.MENTIONS
WORK.CHAT
```

Không đổi Module ID sau khi module đã có dữ liệu production. Nếu cần thay thế, tạo version/module mới và migration có kiểm soát.

## 4. Module Contract

Mỗi module phải khai báo tối thiểu:

```yaml
moduleId:
parentModule:
version:
status:
purpose:
ownedEntities:
ownedCollections:
permissions:
dependencies:
providedEvents:
consumedEvents:
uiEntry:
featureFlags:
rollbackBoundary:
regressionSuite:
```

### 4.1 Ownership

Module sở hữu entity/collection của mình. Module khác chỉ tham chiếu thông qua ID hoặc contract.

Ví dụ:

```text
WORK.CHECKLIST owns checklist items
WORK.COMMENTS owns comments
WORK.CHAT owns conversations/messages for Work Chat
```

Không cho `WORK.CHAT` tự sửa document checklist.

## 5. Permission Isolation

Permission phải có namespace theo Module ID.

Ví dụ:

```text
WORK.TASK.READ
WORK.TASK.UPDATE
WORK.CHECKLIST.READ
WORK.CHECKLIST.CREATE
WORK.COMMENTS.READ
WORK.COMMENTS.CREATE
WORK.MENTIONS.CREATE
WORK.CHAT.READ
WORK.CHAT.CREATE
```

### Quy tắc

1. Module chỉ sở hữu permission namespace của chính nó.
2. Cấp permission cho `WORK.CHAT` không cấp quyền cho `WORK.CHECKLIST`.
3. Thu hồi permission của `WORK.CHAT` không làm mất quyền `WORK.COMMENTS`.
4. Dependency không đồng nghĩa với quyền sở hữu.
5. Nếu Chat cần biết người dùng có quyền vào Task, Chat **tham chiếu capability `WORK.TASK.READ`**; không sao chép hoặc sửa rule của Task.

## 6. Dependency Direction

Dependency phải khai báo và đi một chiều.

```text
WORK.CHAT
   └── requires: WORK.TASK.READ
```

Không được tạo dependency vòng:

```text
WORK.CHAT → WORK.TASK → WORK.CHAT   ❌
```

Core chỉ cung cấp contract chung; Core không chứa implementation nghiệp vụ của plugin.

## 7. Data Boundary

Mỗi plugin phải có collection namespace riêng khi dữ liệu có lifecycle riêng.

Khuyến nghị:

```text
workTasks
workTaskComments
workTaskChecklists
workTaskMentions
workTaskChats
```

Nếu vì backward compatibility phải dùng subcollection hiện hữu, quyền vẫn phải được tổ chức theo plugin contract. Không dùng một `allow` chung cho toàn bộ Work chỉ vì các plugin nằm dưới cùng một Task.

## 8. Rule Boundary

Firestore Rules phải phản ánh Module Contract.

Một thay đổi ở:

```text
WORK.CHAT
```

chỉ được phép thay đổi:

- helper/permission contract liên quan Chat;
- match path thuộc Chat;
- dependency contract đã được khai báo.

Không được tùy tiện sửa rule của:

```text
WORK.CHECKLIST
WORK.MENTIONS
WORK.ANALYTICS
```

Nếu cần thay đổi shared helper, change phải được đánh dấu **HIGH RISK**, phân tích toàn bộ consumers và chạy regression bắt buộc.

## 9. Event Contract

Plugin giao tiếp bằng event có schema ổn định.

Ví dụ:

```text
WORK.TASK.OPENED
WORK.TASK.UPDATED
WORK.COMMENTS.CREATED
WORK.MENTIONS.CREATED
WORK.CHAT.MESSAGE_CREATED
```

Event payload chỉ chứa dữ liệu contract cần thiết, ví dụ:

```json
{
  "taskId": "...",
  "actorId": "...",
  "moduleId": "WORK.CHAT"
}
```

Plugin không được phụ thuộc vào DOM nội bộ của plugin khác.

## 10. UI Boundary

Mỗi plugin phải có entry point và DOM ownership riêng.

Plugin khác chỉ tương tác qua:

- public component API;
- event contract;
- shared UI primitives.

Không được dùng selector nội bộ của plugin khác làm API ngầm.

## 11. Feature Flags

Module mới nên có feature flag trước khi production rollout:

```text
module.work.chat.enabled = false
```

Có thể bật cho Admin/test group trước, sau đó rollout cho toàn tổ chức.

## 12. Versioning

Module có version độc lập:

```text
WORK.CHAT@1.0.0
```

Thay đổi breaking phải tăng major version hoặc có migration/compatibility layer.

## 13. Rollback

Mỗi module phải có rollback boundary.

Rollback `WORK.CHAT` không được rollback:

```text
WORK.TASK
WORK.CHECKLIST
WORK.COMMENTS
```

Dữ liệu migration phải reversible hoặc có kế hoạch recovery rõ ràng.

## 14. Regression Gate

Một plugin chỉ được release khi:

- unit/module test PASS;
- permission test PASS;
- integration contract PASS;
- parent module PASS;
- sibling modules PASS;
- core smoke test PASS.

Ví dụ thêm `WORK.CHAT` phải chứng minh:

```text
WORK.TASK       PASS
WORK.CHECKLIST  PASS
WORK.COMMENTS   PASS
WORK.MENTIONS   PASS
WORK.ANALYTICS  PASS
WORK.CHAT       PASS
```

## 15. Anti-Corruption Rule

Không được giải quyết lỗi plugin bằng cách mở quyền quá rộng ở parent module.

Ví dụ **cấm**:

```text
allow read, write: if isMember();
```

chỉ để Chat chạy được.

Phải tìm đúng capability và resource cần cấp quyền.

## 16. Production Rule

`main` là production baseline. Plugin mới phải đi qua:

```text
SPEC
→ CONTRACT
→ FEATURE BRANCH
→ IMPLEMENT
→ PERMISSION TEST
→ REGRESSION
→ DRAFT PR
→ REVIEW
→ RELEASE
```

Không merge chỉ vì tính năng mới chạy được.

## 17. Definition of Done

Một plugin được coi là hoàn thành khi:

- có Module ID;
- có Contract;
- có owner;
- có collection boundary;
- có permission namespace;
- có dependency declaration;
- có event contract nếu cần;
- có feature flag nếu phù hợp;
- có rollback plan;
- có regression suite;
- không phá sibling modules;
- documentation được cập nhật.
