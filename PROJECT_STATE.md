# SAOVN-OS — PROJECT STATE

> Checkpoint: 21/08/2026 — Work security read scope corrected; waiting for Firebase Rules publish + regression

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

SAOVN-OS là môi trường làm việc online và Organizational Operating System cho SAOVN.

## 2. Current Branch / Release State

```text
branch: chore/engineering-governance
PR: #1
main: KHÔNG MERGE
```

All engineering changes remain isolated on the governance branch.

Latest Rules fix commit:

```text
ab952dd06bd9ae2f5be1c76749484c72f6dd2d80
```

Latest application commit before this Rules fix:

```text
85821fb3dfd306b391a9a4c048f879d3af7b9b68
```

## 3. Security Rule Tree

Firestore remains one published file, internally divided into:

```text
ROOT
├── CORE
├── ADMIN
├── MEMBER
└── WORK
    ├── TASK
    ├── CHECKLIST
    ├── COMMENTS
    ├── ACTIVITY
    ├── MENTIONS
    ├── ANALYTICS
    └── CHAT
```

Supporting documents:

- `SECURITY_RULE_TREE.md`
- `SECURITY_RULE_CONTRACT.md`

Rule: a capability defect must be repaired inside its own branch; do not widen unrelated Admin/Member permissions as a shortcut.

## 4. Latest Rules Change

`WORK.TASK.READ` now explicitly permits an authenticated active organization member to read tasks matching their own department/team scope.

This is separate from edit authority.

```text
READ:
  assigned task
  legacy assigned task
  own-created task
  management-scope task
  own department/team scope task

UPDATE:
  management authority
  OR assigned/owned task with only:
    status
    updatedAt
    updatedBy
```

The membership directory read branch was also kept explicit for `ACTIVE` and `active` membership status values, so Member/Work queries can read active memberships without opening membership writes.

## 5. Known Test Member

```text
UID: 49jMcXigONdASEPDpvco02EaHPx1
membership: mem_49jMcXigONdASEPDpvco02EaHPx1_org_saovn_01
status: ACTIVE
role: org_member
position: INTERN
```

Known test task contains this UID in `assigneeIds`.

## 6. Application Fixes Already Completed

- Removed competing automatic Work assignee migration behavior on page load.
- Removed competing Member Firebase Work fallback renderer.
- `work-v3.js` remains the single Work task renderer.
- Member Overview explicitly displays `TỔNG CÔNG VIỆC` from the member's Work queries.
- Team member profile navigation was isolated from a second directory permission query.

Latest Team-link fix:

```text
85821fb3dfd306b391a9a4c048f879d3af7b9b68
```

## 7. Last Human Test Findings

ADMIN:
- Work previously hung.
- Department → Team member names were not consistently clickable.
- Other Admin areas were comparatively stable.

MEMBER:
- Overview did not show Work total.
- Work did not show current tasks and previously lost some Team/other scope UI.
- Department did not show Work.
- Members page reported `Đọc memberships Active: Missing or insufficient permissions.`

## 8. Current Intended Fix

The latest Rules commit addresses the Work read-scope defect that caused member department/team Work queries to be denied while leaving Member task editing restricted.

No broad `allow read, write: if signedIn()` shortcut was introduced.

## 9. Human Action Required Now

The latest Rules file is **NOT YET confirmed published to Firebase** after commit `ab952dd06bd9ae2f5be1c76749484c72f6dd2d80`.

Human must:

1. Open Firebase Console → Firestore Database → Rules.
2. Replace the entire Rules editor with the latest `firestore.rules` from `chore/engineering-governance`.
3. Publish.
4. Then test the latest Vercel deployment.

Do not edit Rules manually beyond that file and do not merge to `main`.

## 10. Regression Gate

After Publish:

```text
ADMIN
  Work loads without hanging
  existing tasks appear
  total count appears
  Comment works
  Checklist works
  Kanban move works
  Department → Team member click works

MEMBER
  Overview shows TỔNG CÔNG VIỆC
  Work shows assigned/current tasks
  Team/other Work navigation remains visible
  Department shows permitted Work
  Members page loads without membership permission error
  Kanban move works for assigned task
  Checklist read/create works
  Comment read/create works
  @Tag works

CROSS-REGRESSION
  Admin remains usable after Member test
  Member remains usable after Admin test
  no page hangs
  no unrelated permission-denied errors
```

No capability is marked PASS/LOCKED until tested evidence exists.

# END OF PROJECT STATE
