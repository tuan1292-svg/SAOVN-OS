# SAOVN-OS — PROJECT STATE

> Chốt sổ: 19/08/2026 — Firestore Security Modularization checkpoint

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

---

## 2. Current Development Strategy

SAOVN-OS sử dụng **production-safe modular development** vì hệ thống được sử dụng song song với quá trình phát triển.

Nguyên tắc bắt buộc:

```text
BASELINE
  ↓
IMPACT ANALYSIS
  ↓
MODULE BOUNDARY
  ↓
CODE + DATA CONTRACT
  ↓
FIRESTORE PERMISSION CONTRACT
  ↓
REGRESSION
  ↓
REVIEW / RELEASE GATE
  ↓
MERGE
```

Không mở rộng quyền parent để chữa lỗi child. Không sửa module cũ chỉ vì thêm module mới nếu không có impact analysis. Không merge khi regression chưa có bằng chứng.

---

## 3. Modular Web Architecture — CURRENT

WORK đã được tách thành parent/child modules:

```text
WORK
├── WORK.TASK
├── WORK.CHECKLIST
├── WORK.COMMENTS
├── WORK.MENTIONS
├── WORK.ANALYTICS
└── WORK.CHAT
```

Web code/plugin boundary đã tồn tại và phải tiếp tục được bảo vệ.

---

## 4. Critical Architecture Finding — Firestore Rules

### Kết luận của checkpoint 19/08/2026

**Web code đã được modular hóa, nhưng Firestore Security Rules hiện vẫn là một shared/high-risk ruleset.**

Đây là nguyên nhân kiến trúc khiến các lần sửa quyền cho một actor/module có thể làm regress module khác.

Ví dụ đã quan sát:

```text
Sửa Member permission
    ↓
Members/Admin behavior regress

Sửa Admin/identity permission
    ↓
Member Work behavior regress
```

Do đó **không tiếp tục vá `firestore.rules` theo kiểu mở rộng quyền toàn cục**.

### Kiến trúc Rules mục tiêu

Firestore chỉ có một ruleset cuối cùng cho database, nhưng source logic phải được tách theo namespace/module:

```text
FIRESTORE SECURITY SOURCE
│
├── CORE
│   ├── AUTHORIZATION
│   ├── IDENTITY
│   ├── MEMBERSHIP
│   └── ORGANIZATION
│
├── ADMIN
│   ├── MEMBERS
│   ├── USERS / IDENTITIES
│   ├── DEPARTMENTS
│   ├── ROLES
│   ├── PROJECTS
│   └── SYSTEM
│
├── MEMBER
│   ├── IDENTITY
│   ├── WORK
│   ├── ATTENDANCE
│   ├── PROJECTS
│   └── NOTIFICATIONS
│
└── WORK
    ├── TASK
    ├── CHECKLIST
    ├── COMMENTS
    ├── MENTIONS
    ├── ANALYTICS
    └── CHAT
```

Target permission namespaces:

```text
ADMIN.*
MEMBER.*
WORK.TASK.*
WORK.CHECKLIST.*
WORK.COMMENTS.*
WORK.MENTIONS.*
WORK.ANALYTICS.*
WORK.CHAT.*
```

### Non-negotiable security boundary

```text
Sửa ADMIN
  → không được làm hỏng MEMBER

Sửa MEMBER
  → không được làm hỏng ADMIN

Sửa WORK
  → không được làm hỏng MEMBERS / ADMIN
```

Một Firestore `firestore.rules` cuối cùng vẫn được publish, nhưng source rule logic phải có boundary rõ ràng và được kiểm thử độc lập theo actor + module + operation.

---

## 5. Work Data Ownership

```text
WORK.TASK
  → workTasks/{taskId}

WORK.CHECKLIST
  → workTasks/{taskId}/checklist/{itemId}

WORK.COMMENTS
  → workTasks/{taskId}/comments/{commentId}

WORK.MENTIONS
  → mention resolution / mention events / notifications

WORK.ANALYTICS
  → derived / aggregate analytics

WORK.CHAT
  → workTasks/{taskId}/chat/{messageId}
```

Legacy storage paths của Checklist/Comments vẫn là **legacy storage contracts** cho tới khi có migration riêng. Không destructive migration chỉ để làm đẹp kiến trúc.

---

## 6. Current Work Permission Test

Test member:

```text
UID: 49jMcXigONdASEPDpvco02EaHPx1
membership: mem_49jMcXigONdASEPDpvco02EaHPx1_org_saovn_01
status: ACTIVE
role: org_member
position: INTERN
```

Task test đã xác minh UID member nằm trong `assigneeIds`.

Observed baseline:

```text
Admin @Tag        PASS
Admin Comment     PASS (đã từng xác nhận)
Admin Checklist   PASS (đã từng xác nhận)

Member @Tag       PASS
Member Comment    permission-denied
Member Checklist  permission-denied
Member Kanban     permission-denied
```

Ngoài ra đã gặp:

```text
members.js
  → Đọc memberships Active
  → permission-denied

Admin page / identities
  → permission-denied trong một số bản Rules thử nghiệm
```

Một số bản Rules thử nghiệm gần đây làm Members/Admin regress hoặc gây treo UI. **Không coi các bản Rules thử nghiệm đó là production baseline.**

---

## 7. Current UI Issues Reported

### WORK / ANALYTICS

Khi Admin hoặc Member click tên thành viên trong phần:

```text
WORK / ANALYTICS
  → Hiệu suất công việc
```

đang bị dẫn sang giao diện Members và giao diện bị xô lệch.

### WORK / TEAM

```text
Member name → click được
Admin name  → hiện chỉ là text, chưa click được
```

Các lỗi này thuộc **Work UI/module boundary**, không được chữa bằng cách mở quyền Firestore toàn cục.

---

## 8. Firestore Rules Status

`firestore.rules` là **shared high-risk boundary** và hiện **CHƯA được coi là hoàn tất**.

Các bản Rules thử nghiệm đã được commit trên branch `chore/engineering-governance`, nhưng không được coi là production-safe chỉ vì console error giảm.

Nguyên tắc mới:

```text
permission-denied
  ↓
module owner
  ↓
operation
  ↓
actor
  ↓
scope
  ↓
minimal capability
  ↓
Admin regression
  ↓
Member regression
  ↓
release gate
```

Không tiếp tục nới `identities` / `memberships` / `isMember()` / `isAdmin()` toàn cục để chữa lỗi Work.

---

## 9. Branch / Release State

Engineering work đang nằm trên:

```text
branch: chore/engineering-governance
PR: #1
PR state: OPEN / DRAFT / NOT MERGED
```

Production rule:

```text
main: KHÔNG MERGE branch này tại checkpoint này
```

Lý do: Rules và Work Member permission chưa đạt regression gate.

---

## 10. What Is Closed

```text
✓ Engineering Change Control baseline
✓ Module Boundary Rules baseline
✓ Web Work module/plugin boundary
✓ Work module registry / contracts
✓ Work ownership baseline
✓ Permission namespace concept
✓ Regression gate concept
✓ @Tag path đã từng test PASS cho Admin + Member
✓ Admin Comment/Checklist đã từng test PASS
```

Đây là **architecture/governance checkpoint**, không phải tuyên bố toàn bộ Work permission đã hoàn tất.

---

## 11. What Remains Open

```text
1. Tái cấu trúc Firestore Rules theo security/module boundary.
2. Tách rõ ADMIN permission contract.
3. Tách rõ MEMBER permission contract.
4. Tách riêng WORK.TASK capability.
5. Tách riêng WORK.CHECKLIST capability.
6. Tách riêng WORK.COMMENTS capability.
7. Tách riêng WORK.MENTIONS capability.
8. Tách riêng WORK.ANALYTICS capability.
9. Tách riêng WORK.CHAT capability.
10. Có một final firestore.rules được assemble từ các boundary rõ ràng.
11. Regression Admin sau mọi thay đổi Member.
12. Regression Member sau mọi thay đổi Admin.
13. Regression Members/Admin sau mọi thay đổi Work.
14. Sửa Work Analytics profile navigation.
15. Làm Admin identity trong Work Team clickable.
16. Sau khi security boundary ổn mới xử lý tiếp Member Checklist/Comment/Kanban.
17. Chỉ merge sau release gate.
```

---

## 12. Next Session — Immediate Plan

Không tiếp tục patch Rules hiện tại theo kiểu ad-hoc.

Bắt đầu từ:

```text
CURRENT BASELINE
  ↓
DESIGN SECURITY MODULE BOUNDARIES
  ↓
ADMIN RULE CONTRACT
  ↓
MEMBER RULE CONTRACT
  ↓
WORK RULE CONTRACTS
  ↓
ASSEMBLE FINAL FIRESTORE RULES
  ↓
EMULATOR / RULES TEST IF AVAILABLE
  ↓
ADMIN REGRESSION
  ↓
MEMBER REGRESSION
  ↓
WORK REGRESSION
  ↓
PUBLISH ONLY AFTER PASS
```

Mục tiêu là **không còn tình trạng sửa Admin làm hỏng Member hoặc sửa Member làm hỏng Admin**.

---

## 13. Working Rule From Now On

> **Một module mới là một plug-in có boundary, không phải một lý do để sửa cả parent.**

> **Một permission mới là một capability có scope, không phải một lý do để mở rộng quyền chung.**

> **Admin, Member và Work phải có security boundary độc lập.**

> **Phần đã PASS phải được bảo vệ bằng regression trước khi merge thay đổi mới.**

> **Không tuyên bố PASS nếu chưa có evidence.**

> **Không merge vào production khi chưa có rollback + regression evidence.**

---

# END OF PROJECT STATE
