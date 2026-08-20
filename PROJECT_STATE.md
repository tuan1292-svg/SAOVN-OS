# SAOVN-OS — PROJECT STATE

> Checkpoint: 20/08/2026 — Security Tree + Work Rules refactor ready for Firebase publish/test

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

---

## 2. Current Branch / Release State

Engineering work đang nằm trên:

```text
branch: chore/engineering-governance
PR: #1
main: KHÔNG MERGE tại checkpoint này
```

Latest security refactor commit:

```text
1f5e80ae8ddf63f562353de413d94811135aaa2c
```

This commit updates `firestore.rules` to a tree/boundary structure and narrows assigned-member task updates to status/audit fields.

**Firebase has NOT been instructed/published from this checkpoint yet.** The next human action is to review/copy the branch `firestore.rules` into Firebase Console and Publish, then run the regression tests below.

---

## 3. Security Architecture — LOCKING MODEL

Firestore still publishes one final `firestore.rules` file, but the file is internally structured as:

```text
ROOT
├── CORE
├── ADMIN
├── MEMBER
└── WORK
    ├── TASK
    ├── CHECKLIST
    ├── COMMENTS
    ├── MENTIONS
    ├── ANALYTICS
    └── CHAT
```

Supporting governance documents:

- `SECURITY_RULE_TREE.md`
- `SECURITY_RULE_CONTRACT.md`

Rule:

> A PASS node is locked against unrelated changes. A child defect must not be repaired by widening another branch.

No node is considered permanently `LOCKED` until the regression evidence exists.

---

## 4. Current Firestore Rules Refactor

`firestore.rules` has been rewritten structurally on the engineering branch.

### CORE

Shared authorization primitives remain at the root:

- signed-in state
- membership identity
- organization/system role helpers
- department/team scope helpers

CORE is high-impact and requires full regression if changed.

### ADMIN

Administrative collections remain isolated conceptually:

- identities administration
- memberships
- invitations
- departments
- roles
- system

### MEMBER

Member-facing collections remain separate conceptually:

- attendance
- documents
- projects
- notifications

### WORK

Work capabilities now have explicit helper contracts:

- `WORK.TASK.READ`
- `WORK.TASK.CREATE`
- `WORK.TASK.UPDATE`
- `WORK.TASK.DELETE`
- `WORK.CHECKLIST.*`
- `WORK.COMMENTS.*`
- `WORK.ACTIVITY.*`
- `WORK.CHAT.*`
- `WORK.MENTIONS`

For assigned members, Work task UPDATE is intentionally restricted to:

```text
status
updatedAt
updatedBy
```

This is specifically to make Kanban movement possible without allowing an ordinary assigned member to rewrite assignment/scope ownership fields.

Checklist and comments inherit only the parent Work task readability contract.

---

## 5. Known Test Member

```text
UID: 49jMcXigONdASEPDpvco02EaHPx1
membership: mem_49jMcXigONdASEPDpvco02EaHPx1_org_saovn_01
status: ACTIVE
role: org_member
position: INTERN
```

The known Work test task contains this UID in `assigneeIds`.

---

## 6. Previous Baseline / Regression History

Previously observed:

```text
Admin @Tag        PASS
Admin Comment     PASS
Admin Checklist   PASS
Member @Tag       PASS
Member Comment    permission-denied
Member Checklist  permission-denied
Member Kanban     permission-denied
```

Previous experiments also caused regressions in Members/Admin. Those experimental versions are **not** the production baseline.

Current objective is to test the new structured rules without changing unrelated UI code first.

---

## 7. UI Issues Still Open

These remain application/module issues and must not be solved by broad Firestore permission changes:

```text
WORK / ANALYTICS
  member/admin click on member name → currently routes to Members UI and layout becomes displaced

WORK / TEAM
  member name → clickable
  admin name  → currently text only
```

---

## 8. Required Regression Gate After Firebase Publish

Human tester must verify, in this order:

```text
A. Admin
   1. Admin page loads
   2. Members/admin directory loads
   3. Admin Work task loads
   4. Admin comment works
   5. Admin checklist works

B. Member
   1. Member dashboard loads
   2. Members-related page still loads where applicable
   3. Assigned Work task loads
   4. Member Kanban move works
   5. Member checklist read/create works
   6. Member comment read/create works
   7. @Tag still works

C. Cross-branch regression
   1. Admin remains usable after Member tests
   2. Member remains usable after Admin tests
   3. No page hangs
   4. No new permission-denied errors outside the tested Work capability
```

Only after this evidence may a branch be marked PASS/LOCKED and considered for merge.

---

## 9. Immediate Human Action

**STOP HERE until Firebase Rules are published.**

Use the latest branch file:

`firestore.rules` at commit `1f5e80ae8ddf63f562353de413d94811135aaa2c`

Publish it in Firebase Console → Firestore Database → Rules.

Then test the known Member and Admin using the regression gate above.

Do **not** merge to `main` yet.

---

## 10. Working Rule From Now On

> **Sửa ADMIN không được làm hỏng MEMBER.**

> **Sửa MEMBER không được làm hỏng ADMIN.**

> **Sửa WORK không được làm hỏng ADMIN/MEMBER.**

> **Một node đã PASS phải được regression-protect trước khi thay đổi node khác.**

> **Không dùng broad allow read/write làm shortcut cho một capability con.**

> **Không tuyên bố PASS nếu chưa có evidence.**

# END OF PROJECT STATE
