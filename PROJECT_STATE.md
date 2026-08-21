# SAOVN-OS — PROJECT STATE

> Checkpoint: 21/08/2026 — Member Work permissions isolated; Admin Team links hardened; Firebase Rules publish is the remaining human action before final regression

## 1. Project

**Project:** SAOVN-OS  
**Organization:** SAOVN  
**Repository:** https://github.com/tuan1292-svg/SAOVN-OS.git  
**Local:** `C:\Users\Admin\Desktop\SAOVN-OS`

## 2. Current Branch / Release State

```text
branch: chore/engineering-governance
PR: #1
main: KHÔNG MERGE
```

All engineering changes remain isolated on the governance branch.

Latest application commit:

```text
79101c6208278e7f0e48f53d3419f29264c14832
```

Latest Vercel deployment from that commit:

```text
saovn-fq4pt8cnx-tuans-projects-ce1336a7.vercel.app
state: READY
```

Latest Rules commit:

```text
ab952dd06bd9ae2f5be1c76749484c72f6dd2d80
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

Rule: a capability defect must be repaired inside its own branch; do not widen unrelated Admin/Member permissions as a shortcut.

## 4. Current Rules Fix

`firestore.rules` on the governance branch now explicitly permits an authenticated member to READ Work tasks in their own department/team scope while keeping task UPDATE restricted.

It also explicitly permits active/ACTIVE membership directory reads, so Member/Work directory queries can resolve personnel data without opening membership writes.

For Work child modules, READ/CREATE/UPDATE/DELETE are evaluated against the parent task's `taskReadable()` scope for:

- `workTasks/{taskId}/checklist/*`
- `workTasks/{taskId}/comments/*`
- `workTasks/{taskId}/activity/*`
- `workTasks/{taskId}/chat/*`

Member Kanban status changes remain limited to:

```text
status
updatedAt
updatedBy
```

for assigned/owned tasks.

## 5. Known Test Member

```text
UID: 49jMcXigONdASEPDpvco02EaHPx1
membership: mem_49jMcXigONdASEPDpvco02EaHPx1_org_saovn_01
status: ACTIVE
role: org_member
position: INTERN
```

Known test task contains this UID in `assigneeIds`.

## 6. Application Fix Completed In This Session

The department Team-link bridge was fixed so the legacy Team renderer can resolve a displayed member name to its active identity/membership UID and make it open the member profile.

This specifically closes the remaining Admin-side symptom where the Admin/Founder entry was rendered as plain text and could not be clicked.

Commit:

```text
79101c6208278e7f0e48f53d3419f29264c14832
```

## 7. Current Human Test Findings

### MEMBER — remaining failures observed before latest Rules publish

- Work checklist: permission-denied
- Work comments: permission-denied
- Work Kanban move: permission-denied
- Members page: cannot load Active memberships/personnel

These failures are consistent with the Firebase Console still running the older Rules version supplied earlier in the session.

### ADMIN

- Work is substantially usable.
- Remaining known issue was Department → Team member profile clickability.
- Application-side bridge for that legacy renderer is now fixed in commit `79101c6208278e7f0e48f53d3419f29264c14832`.

## 8. Human Action Required Now

**Only one manual action is required before the final regression:**

1. Open Firebase Console → Firestore Database → Rules.
2. Replace the entire Rules editor with the current `firestore.rules` from `chore/engineering-governance`.
3. Publish.
4. Open the latest Vercel deployment below and run the Member regression first.

Do not merge to `main` yet.

## 9. Latest Test Deployment

```text
https://saovn-fq4pt8cnx-tuans-projects-ce1336a7.vercel.app
```

## 10. Final Regression Gate

### MEMBER

- Overview shows Work total
- Work shows current/assigned tasks
- Checklist READ + CREATE + UPDATE works
- Comments READ + CREATE works
- Kanban move works for assigned task
- Members page loads personnel without permission-denied
- @Tag works
- Department Work remains visible

### ADMIN

- Work does not hang
- Existing tasks remain visible
- Checklist works
- Comments work
- Kanban move works
- Department Team member names click to profiles

### CROSS-REGRESSION

- Test Member first, then Admin
- Test Admin first, then Member
- No page hangs
- No unrelated permission-denied errors

No capability is marked PASS/LOCKED until human test evidence confirms it.

# END OF PROJECT STATE
