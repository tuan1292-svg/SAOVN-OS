# SAOVN-OS Production Regression Matrix

This matrix protects features already used by employees. It is the minimum manual gate until automated end-to-end tests cover the same scenarios.

## Roles

- **ADMIN:** organization/system administrator
- **MEMBER:** normal active employee

## P0 — production access

| Area | Admin | Member | Pass condition |
|---|---|---|---|
| Login | ☐ | ☐ | Successful login reaches Dashboard |
| Identity | ☐ | ☐ | Correct identity loads |
| Membership | ☐ | ☐ | Correct active membership loads |
| Logout | ☐ | ☐ | Session ends correctly |

A P0 failure blocks release.

## P1 — Work

| Area | Admin | Member | Pass condition |
|---|---|---|---|
| Work list | ☐ | ☐ | Tasks load without permission errors |
| Task detail | ☐ | ☐ | Detail opens |
| Task creation | ☐ | ☐ | Authorized role can create |
| Assignment | ☐ | ☐ | Authorized assignment works |
| Kanban status | ☐ | ☐ | Authorized status update works |
| Checklist read | ☐ | ☐ | Checklist loads |
| Checklist write | ☐ | ☐ | Authorized checklist operation works |
| Comments read | ☐ | ☐ | Existing comments load |
| Comment create | ☐ | ☐ | Comment appears after send |
| Mention picker | ☐ | ☐ | Eligible people appear after `@` |
| Mention send | ☐ | ☐ | Tagged comment is created |
| Mention notification | ☐ | ☐ | Recipient receives WORK_MENTION notification |
| Work analytics | ☐ | ☐ | Authorized analytics load or intentionally skip without breaking Work |

## P1 — Communication

| Area | Admin | Member | Pass condition |
|---|---|---|---|
| Conversation list | ☐ | ☐ | Accessible conversations load |
| Open conversation | ☐ | ☐ | Messages load |
| Send message | ☐ | ☐ | Message appears |
| Unread count | ☐ | ☐ | Count updates correctly |
| Chat notification | ☐ | ☐ | Recipient receives notification |

## P1 — Attendance / System Access

| Area | Admin | Member | Pass condition |
|---|---|---|---|
| Login attendance | ☐ | ☐ | Successful login records today's access |
| Daily view | ☐ | ☐ | Correct percentage/count appears |
| Weekly view | ☐ | ☐ | Correct percentage/count appears |
| Admin presence | ☐ | ☐ | Admin is represented correctly |
| Member presence | ☐ | ☐ | Member is represented correctly |

## P2 — security / boundary checks

- ☐ Member cannot access another member's private data outside documented scope.
- ☐ Member cannot alter another member's Attendance record.
- ☐ Unauthorized user cannot read Work Task data.
- ☐ Unauthorized user cannot create Work comments/checklist data.
- ☐ Mention notifications cannot be forged for an unrelated task.
- ☐ Chat notifications cannot be forged as another sender.

## Release decision

**PASS:** all required checks for the change and all P0 checks pass; affected P1/P2 checks pass.

**BLOCK:** any P0 failure, any security regression, or any existing feature that was PASS before the change and FAILS afterward.

## Test record

For each release, record:

- Date/time:
- Production commit:
- Change branch / PR:
- Tester:
- Changed module:
- Checks executed:
- Failed checks:
- Release decision:
- Rollback commit (if applicable):
