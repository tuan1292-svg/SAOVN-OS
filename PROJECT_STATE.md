# SAOVN-OS — PROJECT STATE

> Checkpoint: 20/08/2026 — Security Tree + Work Rules refactor published; first regression exposed Work UI coupling

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

Security refactor commit:

```text
1f5e80ae8ddf63f562353de413d94811135aaa2c
```

Firebase Rules from that branch have now been manually published by the human tester.

Latest application fixes are on the same engineering branch and are automatically deployed by Vercel Git integration.

Latest tested-ready deployment:

```text
https://saovn-ezsfp5b5v-tuans-projects-ce1336a7.vercel.app
commit: b5a1d594f100ec8995595fd1d154f679feed15ed
state: READY
```

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

`firestore.rules` has been rewritten structurally on the engineering branch and published to Firebase.

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

## 6. Current Regression Findings

After publishing the structured Rules and testing the latest Vercel deployment:

```text
ADMIN
  Work → page became unresponsive / appeared to hang
  Other Admin tests were not completed in this round

MEMBER
  Work → assigned/current tasks were not returned in the UI
  Dashboard / Overview → total Work count was not visible
```

The immediate application diagnosis found two competing legacy Work scripts running alongside `work-v3.js`:

```text
work-assignee-migration.js
  → performed bulk Work writes on every Admin Work page load

work-member-firebase-fix.js
  → performed a second Work Firebase read/render path
  → could overwrite the governed Work renderer
```

Both have now been converted to harmless no-op modules. They remain as files only to avoid stale script references in `work.html`; `work-v3.js` is the single Work task renderer.

`dashboard-data-fix.js` has also been updated so the member Overview explicitly displays **TỔNG CÔNG VIỆC** using the same member Work queries.

---

## 7. UI Issues Still Open

These remain application/module issues and must not be solved by broad Firestore permission changes:

```text
WORK / ANALYTICS
  member/admin click on member name → previously routed to Members UI and layout became displaced

WORK / TEAM
  member name → previously clickable
  admin name  → previously text only
```

These are deferred until the basic Work loading regression is stable.

---

## 8. Regression Gate — CURRENT TEST ROUND

The next human test must verify, in this order:

```text
A. Admin
   1. Open Work
   2. Confirm page does not hang
   3. Confirm existing tasks appear
   4. Confirm total count appears
   5. Test Comment
   6. Test Checklist
   7. Test Kanban move

B. Member
   1. Open Dashboard / Overview
   2. Confirm TỔNG CÔNG VIỆC has a number
   3. Open Work
   4. Confirm assigned task appears
   5. Test Kanban move
   6. Test Checklist read/create
   7. Test Comment read/create
   8. Test @Tag

C. Cross-branch regression
   1. Admin remains usable after Member tests
   2. Member remains usable after Admin tests
   3. No page hangs
   4. No new permission-denied errors outside the tested Work capability
```

Only after this evidence may a node be marked PASS/LOCKED and considered for merge.

---

## 9. Immediate Human Action

No Firebase Rules change is requested at this checkpoint.

The Rules are already published. The latest application deployment is:

`https://saovn-ezsfp5b5v-tuans-projects-ce1336a7.vercel.app`

Test the regression gate above. If a capability fails, report the exact Console error before changing Rules.

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
