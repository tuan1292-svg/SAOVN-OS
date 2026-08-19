# SAOVN-OS — PROJECT STATE

> Chốt sổ: 18/08/2026 — Engineering Governance / Modular Work checkpoint

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

---

## 2. Current Development Strategy

SAOVN-OS chuyển sang quy trình **production-safe modular development** vì nhân viên đang sử dụng hệ thống song song với quá trình phát triển.

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

Các quy tắc này đã được ghi vào:

```text
00_CONSTITUTION/ENGINEERING_CHANGE_CONTROL.md
00_CONSTITUTION/MODULE_BOUNDARY_RULES.md
00_CONSTITUTION/MODULE_CONTRACTS/
DOCS/QA/REGRESSION_MATRIX.md
DOCS/QA/RELEASE_CHECKLIST.md
```

---

## 3. Modular Work Architecture — CURRENT

WORK được chuẩn hóa theo mô hình parent/child:

```text
WORK
├── WORK.TASK
├── WORK.CHECKLIST
├── WORK.COMMENTS
├── WORK.MENTIONS
├── WORK.ANALYTICS
└── WORK.CHAT
```

Mỗi child module phải có:

```text
- Module ID
- Parent
- Ownership
- Dependencies
- Permission namespace
- Public contract
- Failure behavior
- Regression coverage
```

Permission namespace mục tiêu:

```text
WORK.TASK.*
WORK.CHECKLIST.*
WORK.COMMENTS.*
WORK.MENTIONS.*
WORK.ANALYTICS.*
WORK.CHAT.*
```

Child module không được tự động thừa hưởng toàn bộ quyền của parent.

---

## 4. Work Data Ownership

Ownership baseline:

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

Legacy storage paths của Checklist/Comments vẫn được coi là **legacy storage contracts** cho tới khi có migration riêng. Không destructive migration chỉ để làm đẹp kiến trúc.

---

## 5. Work Module Registry / Contracts

Đã có module registry và Work plugin contracts.

Trạng thái:

```text
CORE.AUTH          ACTIVE
CORE.IDENTITY      ACTIVE
CORE.MEMBERSHIP    ACTIVE
CORE.PERMISSION    ACTIVE
CORE.NOTIFICATION  ACTIVE

WORK.TASK          ACTIVE
WORK.CHECKLIST     LEGACY-BOUNDARY
WORK.COMMENTS      LEGACY-BOUNDARY
WORK.MENTIONS      LEGACY-BOUNDARY
WORK.ANALYTICS     LEGACY-BOUNDARY
WORK.CHAT          PLANNED / OPTIONAL

ATTENDANCE         ACTIVE FOUNDATION
```

`LEGACY-BOUNDARY` nghĩa là tính năng đang dùng production/legacy storage hoặc implementation nhưng đã được xác định boundary; không được tự ý refactor destructive.

---

## 6. Work Runtime Protection

Đã có:

```text
✓ Core module registry
✓ Module loader contract
✓ Work module registry
✓ Work module manifest
✓ Permission manifest
✓ Boundary contract
✓ Regression gate
✓ Optional module switch
✓ Failure isolation design
```

`WORK.CHAT` hiện **OFF / optional** cho production. Không được bật chỉ vì code đã tồn tại; phải pass Rules + browser regression trước.

---

## 7. Work Functional Baseline

Đã có và phải được bảo vệ:

```text
✓ My Work
✓ Tasks
✓ Assignments
✓ Deadlines
✓ Progress
✓ Kanban UI
✓ Comments / Trao đổi
✓ Checklist
✓ Activity
✓ Mentions
✓ @tất cả thành viên
✓ Notifications foundation
✓ Multi-assignee
✓ Department / Team scope filtering
✓ Member Work view
✓ Admin Work management
```

Identity trong Work ưu tiên:

```text
Họ tên
Chức danh
```

Không dùng email/username làm Identity chính khi Identity đã có họ tên.

---

## 8. Recent Work Incident / Known Issues

Các lỗi production đã gặp trong checkpoint trước:

```text
FirebaseError: Missing or insufficient permissions.
```

Các vùng từng bị ảnh hưởng:

```text
Work Analytics
Work memberships directory
Checklist
Comments
Mention comment creation
Member Kanban update
```

Nguyên tắc xử lý mới:

```text
permission-denied
  ≠ mở quyền toàn Work

permission-denied
  → xác định module owner
  → xác định operation
  → xác định actor/scope
  → sửa capability đúng module
  → regression sibling modules
```

Không coi Work security là COMPLETE cho tới khi test bằng tài khoản Admin + Member thật.

---

## 9. Comments / Mentions Boundary

`WORK.COMMENTS` là owner của task discussion records.

`WORK.MENTIONS` là owner của mention resolution/events và notification integration, không sở hữu toàn bộ Comments.

Submit comment phải có **một owner rõ ràng**; không cho sibling plugin đồng thời intercept cùng submit event và gây duplicate/blocked submission.

Known requirement:

```text
Comment submit
→ tạo comment
→ resolve mentions
→ tạo notification theo contract
```

Permission của từng operation phải được kiểm tra độc lập.

---

## 10. Firestore Rules Status

`firestore.rules` được coi là **shared high-risk boundary**.

Đã có nguyên tắc:

```text
actor
resource
operation
business reason
scope
affected modules
regression
```

Rules không được mở rộng chỉ để loại bỏ console error.

`WORK.CHAT` không được coi là production-ready khi Rules và browser test chưa chứng minh capability riêng.

---

## 11. QA / Release Gate

Đã thiết lập:

```text
DOCS/QA/REGRESSION_MATRIX.md
DOCS/QA/RELEASE_CHECKLIST.md
```

Các nhóm regression phải bảo vệ:

```text
Login
Attendance
Work Task
Checklist
Comments
Mentions
Analytics
Chat
Notifications
Permission boundaries
```

Release STOP nếu:

```text
- Login Admin/Member hỏng
- Work operation cũ regress
- Chat/Notification regress
- Attendance regress
- Rules chưa verify
- Permission mới rộng hơn contract
- Migration không có rollback
```

---

## 12. Engineering Branch / PR State

Engineering work đang nằm trên:

```text
branch: chore/engineering-governance
PR: #1
```

PR hiện:

```text
OPEN
DRAFT
NOT MERGED
```

PR chứa **application code + Firestore Rules + documentation**.

### Production safety

```text
main: KHÔNG MERGE THAY ĐỔI CỦA BRANCH NÀY TẠI CHECKPOINT NÀY
```

Lý do: branch cần được đồng bộ với production baseline và phải có regression evidence trước khi merge.

---

## 13. What Is Closed

```text
✓ Engineering Change Control
✓ Module Boundary Rules
✓ Module Registry baseline
✓ Work plugin contract baseline
✓ Work ownership baseline
✓ Work permission manifest
✓ Work boundary validation
✓ Work regression gate
✓ Optional plugin isolation design
✓ Comments single-submit ownership fix
✓ @Tag / Mentions path is functional in current staging test
```

Đây là **architecture/governance checkpoint**, không phải tuyên bố rằng toàn bộ Work permission production đã hoàn tất.

---

## 14. Current Member Permission Checkpoint — 2026-08-19

Test member:

```text
UID: 49jMcXigONdASEPDpvco02EaHPx1
membership: mem_49jMcXigONdASEPDpvco02EaHPx1_org_saovn_01
status: ACTIVE
role: org_member
position: INTERN
userId: 49jMcXigONdASEPDpvco02EaHPx1
identityId: 49jMcXigONdASEPDpvco02EaHPx1
```

Test task đã xác minh có UID member trong `assigneeIds`.

Observed browser results:

```text
Admin @Tag        PASS
Admin Comment     PASS
Admin Checklist   PASS

Member @Tag       PASS
Member Comment    permission-denied
Member Checklist  permission-denied
Member Kanban     permission-denied
```

Current code inspection confirms:

```text
work.html
  → work-v3.js
  → work-collab.js
  → WORK.CHECKLIST plugin
  → WORK.COMMENTS plugin
```

The current branch Rules explicitly authorize assigned members through `canReadTaskData()` for the task and its Checklist/Comments subcollections, and the tested member is present in `assigneeIds`.

Therefore the next debugging target is **the deployed Firestore Rules/runtime alignment and the exact Member request**, not membership data and not INTERN-vs-EMPLOYEE classification.

Do not broaden Work permissions globally.

---

## 15. Current Firestore Rules Branch State

The branch `chore/engineering-governance` currently contains the latest `firestore.rules` with:

```text
ACTIVE + active membership status handling
assigned-member task access
assigned-member Comments access
assigned-member Checklist access
assigned-member task status update boundary
```

The browser must be tested against the Rules actually published in Firebase. GitHub branch contents alone do not prove the deployed Rules state.

---

## 16. What Remains Open

```text
1. Verify the Firebase Rules currently published in production match the branch rules.
2. Re-test the exact assigned Member on the same Task.
3. If Member Comment/Checklist still fail, isolate the exact Firestore request/runtime path before changing Rules.
4. Close Member Kanban permission checkpoint.
5. Close Work memberships / analytics permission checkpoint.
6. Verify Checklist / Comments / Mentions end-to-end.
7. Only then enable/test WORK.CHAT.
8. Merge only after release gate passes.
```

---

## 17. Next Session — Immediate Action

```text
CURRENT CHECKPOINT
  ↓
VERIFY PUBLISHED FIRESTORE RULES
  ↓
TEST ASSIGNED MEMBER
  ↓
CAPTURE EXACT FAILED OPERATION
  ↓
FIX ONLY FAILED MODULE / RULE CAPABILITY
  ↓
REGRESSION ADMIN + MEMBER
  ↓
CLOSE WORK PERMISSION CHECKPOINT
  ↓
THEN TEST WORK.CHAT
```

Không bắt đầu Business Module mới trước khi Work permission checkpoint được đóng nếu việc đó có nguy cơ làm phân tán hoặc ảnh hưởng production stability.

---

## 18. Working Rule From Now On

> **Một module mới là một plug-in có boundary, không phải một lý do để sửa cả parent.**

> **Một permission mới là một capability có scope, không phải một lý do để mở rộng quyền chung.**

> **Một lỗi mới phải được cô lập về owner trước khi sửa.**

> **Không tuyên bố PASS nếu chưa có evidence.**

> **Không merge vào production khi chưa có rollback + regression evidence.**

---

# END OF PROJECT STATE
