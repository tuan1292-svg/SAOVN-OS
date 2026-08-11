# SAOVN-OS — WORK STATE MACHINE

**Status:** Draft
**Layer:** Business Module
**Module:** WORK
**Depends On:** WORK Module Specification, WORK Data Model, WORK API Specification

---

## 1. Purpose

This document defines the state machine governing the lifecycle of a WORK Task.

The purpose is to ensure that Task status changes are:

* explicit
* predictable
* authorized
* auditable
* deterministic

The implementation must not allow arbitrary status mutation.

---

## 2. Core Principle

A Task does not change state because a client sends a new status value.

A Task changes state because a valid operation causes a defined state transition.

Conceptually:

```text
Current State
      +
Authorized Action
      +
Valid Conditions
      ↓
Next State
```

---

## 3. Task States

The initial WORK state set is:

```text
draft
assigned
in_progress
blocked
completed
cancelled
archived
```

---

## 4. State Meaning

### draft

The Task exists but has not yet entered active assignment.

### assigned

The Task has an active Assignee and is ready to be worked on.

### in_progress

The Task is actively being executed.

### blocked

The Task cannot currently progress because an external or internal dependency prevents execution.

### completed

The Task has been successfully completed.

### cancelled

The Task has been intentionally stopped without completion.

### archived

The Task has reached a terminal historical state and is retained for record purposes.

---

## 5. State Categories

### Active States

```text
assigned
in_progress
blocked
```

### Terminal Business States

```text
completed
cancelled
```

### Historical State

```text
archived
```

### Initial State

```text
draft
```

---

## 6. State Diagram

The primary lifecycle is:

```text
                 ┌──────────────┐
                 │    draft     │
                 └──────┬───────┘
                        │ assign
                        ▼
                 ┌──────────────┐
                 │   assigned   │
                 └──────┬───────┘
                        │ start
                        ▼
               ┌────────────────┐
               │  in_progress   │
               └───┬────────┬───┘
                   │        │
                block     complete
                   │        │
                   ▼        ▼
             ┌─────────┐  ┌───────────┐
             │ blocked │  │ completed │
             └────┬────┘  └─────┬─────┘
                  │             │
               unblock        archive
                  │             │
                  └──────┐      ▼
                         │  ┌──────────┐
                         └─►│ archived │
                            └──────────┘
```

Cancellation may occur from eligible active states.

---

## 7. Transition Table

| Current State | Action   | Next State  |
| ------------- | -------- | ----------- |
| draft         | assign   | assigned    |
| assigned      | start    | in_progress |
| in_progress   | block    | blocked     |
| blocked       | unblock  | in_progress |
| in_progress   | complete | completed   |
| draft         | cancel   | cancelled   |
| assigned      | cancel   | cancelled   |
| in_progress   | cancel   | cancelled   |
| blocked       | cancel   | cancelled   |
| completed     | archive  | archived    |
| cancelled     | archive  | archived    |

---

## 8. Invalid Transitions

The system must reject transitions not explicitly defined by the state machine.

Examples:

```text
draft → complete
draft → archive
completed → in_progress
completed → cancelled
cancelled → in_progress
archived → in_progress
archived → complete
```

These transitions must never be silently accepted.

---

## 9. Assignment Transition

The operation:

```text
assign
```

causes:

```text
draft
  ↓
assigned
```

Requirements:

```text
Task exists
+
Actor authorized
+
Valid Assignee
```

---

## 10. Assignment Conditions

An Assignment is valid only when:

1. the Assignee is a valid Identity
2. the Assignee belongs to the applicable Organization scope
3. the actor has assignment permission
4. the Task is in an assignable state

---

## 11. Assignment Result

After successful assignment:

```text
Task.status = assigned
```

and an Assignment record becomes active.

A History event must be created:

```text
assigned
```

---

## 12. Reassignment

Reassignment does not create an undefined Task state.

The Task remains:

```text
assigned
```

while the active Assignment changes.

Conceptually:

```text
Assignment A
    ↓
revoked

Assignment B
    ↓
active
```

The Task remains:

```text
assigned
```

---

## 13. Reassignment History

A reassignment must generate:

```text
event_type = reassigned
```

The event metadata should identify:

```text
previous_assignee
new_assignee
```

---

## 14. Start Transition

The operation:

```text
start
```

causes:

```text
assigned
  ↓
in_progress
```

---

## 15. Start Conditions

A Task may be started when:

```text
Task.status = assigned
```

and the actor has the required execution authority.

For normal execution:

```text
Actor = active Assignee
```

Authorized management roles may be permitted by Policy.

---

## 16. Start Result

After successful start:

```text
Task.status = in_progress
```

An active Assignment should receive:

```text
started_at = now
```

A History event is created:

```text
started
```

---

## 17. Progress Update

Progress updates do not necessarily create a new Task state.

While:

```text
Task.status = in_progress
```

the Task may receive Progress Records.

Example:

```text
0%
 ↓
20%
 ↓
50%
 ↓
75%
 ↓
100%
```

---

## 18. Progress Rules

Progress must satisfy:

```text
0 <= progress <= 100
```

The server must reject:

```text
progress < 0
progress > 100
```

---

## 19. Progress Does Not Equal Completion

A client submitting:

```json
{
  "progress": 100
}
```

must not automatically bypass the completion operation unless the Policy explicitly defines such behavior.

The preferred model is:

```text
Progress reaches 100
        ↓
Explicit complete action
        ↓
completed
```

This keeps completion auditable.

---

## 20. Block Transition

The operation:

```text
block
```

causes:

```text
in_progress
  ↓
blocked
```

---

## 21. Block Conditions

A Task may be blocked when:

```text
Task.status = in_progress
```

and the actor is authorized to report or declare a blocking condition.

---

## 22. Block Reason

A block operation may provide:

```text
reason
```

Example:

```json
{
  "reason": "Waiting for required information."
}
```

The reason should be preserved in History metadata.

---

## 23. Block Result

After successful blocking:

```text
Task.status = blocked
```

A History event is created:

```text
blocked
```

---

## 24. Unblock Transition

The operation:

```text
unblock
```

causes:

```text
blocked
  ↓
in_progress
```

---

## 25. Unblock Conditions

The actor must be authorized to unblock the Task.

The system may require that the blocking condition has been resolved.

The exact business rule belongs to Policy.

---

## 26. Unblock Result

After successful unblock:

```text
Task.status = in_progress
```

A History event is created:

```text
unblocked
```

---

## 27. Completion Transition

The operation:

```text
complete
```

causes:

```text
in_progress
  ↓
completed
```

---

## 28. Completion Conditions

The Task may be completed when:

```text
Task.status = in_progress
```

and the actor has completion authority.

---

## 29. Completion Mutation

A successful completion must update:

```text
status = completed
progress = 100
completed_at = now
updated_at = now
version = version + 1
```

---

## 30. Completion Assignment

The active Assignment should receive:

```text
completed_at = now
```

The Assignment may remain as historical record after completion.

---

## 31. Completion History

A History event must be created:

```text
event_type = completed
```

---

## 32. Cancellation

Cancellation is an intentional termination of active work.

The initial valid transitions are:

```text
draft
  ↓
cancelled
```

```text
assigned
  ↓
cancelled
```

```text
in_progress
  ↓
cancelled
```

```text
blocked
  ↓
cancelled
```

---

## 33. Cancellation Conditions

Cancellation requires appropriate authorization.

Cancellation may require a reason.

Example:

```json
{
  "reason": "The requested work is no longer required."
}
```

---

## 34. Cancellation Result

After successful cancellation:

```text
status = cancelled
```

A History event is created:

```text
cancelled
```

---

## 35. Completed Tasks

A completed Task is considered business-complete.

The Task must not normally return to:

```text
assigned
in_progress
blocked
```

unless a future explicit reopening Policy is introduced.

---

## 36. Cancelled Tasks

A cancelled Task is considered terminated.

It must not normally return to:

```text
assigned
in_progress
blocked
completed
```

unless a future explicit reopening or restoration Policy is introduced.

---

## 37. Archive Transition

Archiving is a historical operation.

Valid transitions:

```text
completed
    ↓
archived
```

and:

```text
cancelled
    ↓
archived
```

---

## 38. Archive Conditions

Archiving requires:

```text
Task.status ∈ {completed, cancelled}
```

and appropriate authorization.

---

## 39. Archive Result

After archiving:

```text
status = archived
archived_at = now
```

A History event is created:

```text
archived
```

---

## 40. Archived Tasks

Archived Tasks are immutable from the normal WORK workflow.

The system must reject ordinary operational actions against archived Tasks.

Examples:

```text
start
assign
progress
block
unblock
complete
cancel
```

must be rejected.

---

## 41. Terminality

The state:

```text
archived
```

is terminal within the initial state machine.

No outgoing transition is defined.

---

## 42. State Transition Authorization

State transitions must be authorized independently of the frontend.

The server must evaluate:

```text
Actor
+
Organization
+
Permission
+
Task
+
Current State
+
Requested Action
```

---

## 43. Transition Pipeline

Every transition follows:

```text
Request
  ↓
Authenticate
  ↓
Resolve Actor
  ↓
Resolve Organization
  ↓
Load Task
  ↓
Check Permission
  ↓
Check Current State
  ↓
Check Transition
  ↓
Check Business Conditions
  ↓
Mutate Task
  ↓
Write History
  ↓
Commit
  ↓
Return Task
```

---

## 44. Atomic Transition

A state change and its corresponding History record must be committed atomically whenever the storage system supports transactions.

The system must not produce:

```text
Task changed
+
History missing
```

as a normal successful outcome.

---

## 45. History Requirement

Every successful state transition must create a History record.

Required events include:

```text
assigned
reassigned
started
blocked
unblocked
completed
cancelled
archived
```

---

## 46. Transition Actor

Every History event must identify the actor responsible for the transition.

The actor must come from the authenticated Session.

---

## 47. Transition Timestamp

Every transition event must record:

```text
created_at
```

using a server-controlled timestamp.

Clients must not control the authoritative transition timestamp.

---

## 48. Version Increment

Every successful state transition must increment:

```text
Task.version
```

Example:

```text
version 3
   ↓
version 4
```

This supports optimistic concurrency.

---

## 49. Concurrent Transition

If two actors attempt to transition the same Task simultaneously:

```text
Actor A
    ↓
complete

Actor B
    ↓
cancel
```

only one valid transition should commit according to transaction and concurrency rules.

The losing operation should receive:

```text
409 Conflict
```

when the stored version is stale or the state has already changed.

---

## 50. Invalid Transition Error

The API should return:

```json
{
  "error": {
    "code": "INVALID_TASK_TRANSITION",
    "message": "The requested state transition is not allowed."
  }
}
```

---

## 51. Permission Error

If the transition is valid but the actor lacks permission:

```json
{
  "error": {
    "code": "WORK_PERMISSION_DENIED",
    "message": "You are not authorized to perform this operation."
  }
}
```

---

## 52. Condition Error

If the actor is authorized but a business condition fails:

```json
{
  "error": {
    "code": "TASK_TRANSITION_CONDITION_FAILED",
    "message": "The task cannot perform this transition under its current conditions."
  }
}
```

---

## 53. State Machine Invariant

The following invariant must always hold:

```text
A Task can only enter a state through
an explicitly defined transition.
```

---

## 54. State Machine Invariant — No Arbitrary Status

The API must not expose an operation equivalent to:

```http
PATCH /tasks/{id}

{
  "status": "completed"
}
```

as a generic status mutation.

Instead:

```http
POST /tasks/{id}/complete
```

must be used.

---

## 55. State Machine Invariant — History

If:

```text
Task.status
```

changes, there must be a corresponding lifecycle History event.

---

## 56. State Machine Invariant — Authorization

No transition may occur without server-side authorization.

---

## 57. State Machine Invariant — Scope

No transition may operate across an unauthorized Organization boundary.

---

## 58. State Machine Invariant — Identity

The transition actor must always come from authenticated server context.

---

## 59. State Machine Invariant — Concurrency

A stale client must not overwrite a newer Task state.

---

## 60. State Machine Invariant — Terminal States

Terminal states must not silently become active again.

---

## 61. State Transition Matrix

The complete initial matrix is:

| From        | Assign | Start | Block | Unblock | Complete | Cancel | Archive |
| ----------- | -----: | ----: | ----: | ------: | -------: | -----: | ------: |
| draft       |      ✓ |     ✗ |     ✗ |       ✗ |        ✗ |      ✓ |       ✗ |
| assigned    |     ✓* |     ✓ |     ✗ |       ✗ |        ✗ |      ✓ |       ✗ |
| in_progress |      ✗ |     ✗ |     ✓ |       ✗ |        ✓ |      ✓ |       ✗ |
| blocked     |      ✗ |     ✗ |     ✗ |       ✓ |        ✗ |      ✓ |       ✗ |
| completed   |      ✗ |     ✗ |     ✗ |       ✗ |        ✗ |      ✗ |       ✓ |
| cancelled   |      ✗ |     ✗ |     ✗ |       ✗ |        ✗ |      ✗ |       ✓ |
| archived    |      ✗ |     ✗ |     ✗ |       ✗ |        ✗ |      ✗ |       ✗ |

`*` Assignment from `assigned` represents reassignment rather than another Task-state transition.

---

## 62. State Machine and API

The state machine maps directly to the WORK API:

```text
assign
    ↓
POST /tasks/{id}/assignments

start
    ↓
POST /tasks/{id}/start

progress
    ↓
POST /tasks/{id}/progress

block
    ↓
POST /tasks/{id}/block

unblock
    ↓
POST /tasks/{id}/unblock

complete
    ↓
POST /tasks/{id}/complete

cancel
    ↓
POST /tasks/{id}/cancel

archive
    ↓
POST /tasks/{id}/archive
```

---

## 63. State Machine and Data Model

The state machine operates on the Task fields:

```text
status
progress
completed_at
archived_at
version
updated_at
```

and related records:

```text
Assignment
Progress
History
```

---

## 64. State Machine and Permission Model

The state machine defines:

```text
What transitions exist?
```

The Permission/Policy system defines:

```text
Who may perform them?
```

These responsibilities must remain separate.

---

## 65. State Machine and Policy

Policy may further constrain transitions.

Examples:

```text
Only managers may cancel after work starts.
Only assigned users may submit progress.
Only project owners may archive completed work.
```

These are Policy rules rather than new states.

---

## 66. State Machine and UI

The frontend should derive available actions from:

```text
current state
+
actor permissions
+
policy
```

The frontend must not invent transitions.

---

## 67. Example Workflow

A normal Task lifecycle:

```text
Create
  ↓
draft
  ↓
Assign
  ↓
assigned
  ↓
Start
  ↓
in_progress
  ↓
Progress 25%
  ↓
Progress 60%
  ↓
Block
  ↓
blocked
  ↓
Unblock
  ↓
in_progress
  ↓
Progress 100%
  ↓
Complete
  ↓
completed
  ↓
Archive
  ↓
archived
```

---

## 68. Example Cancellation Workflow

```text
Create
  ↓
draft
  ↓
Assign
  ↓
assigned
  ↓
Start
  ↓
in_progress
  ↓
Cancel
  ↓
cancelled
  ↓
Archive
  ↓
archived
```

---

## 69. Example Reassignment Workflow

```text
draft
  ↓
assigned
  ↓
reassign
  ├── old Assignment → revoked
  └── new Assignment → active
  ↓
assigned
  ↓
start
  ↓
in_progress
```

---

## 70. Future Extensions

Future states may include:

```text
review
reopened
on_hold
waiting
```

However, these must not be added casually.

Any new state requires updates to:

```text
State Machine
Data Model
API Specification
Permission Model
Policy
UI
Tests
Documentation
```

---

## 71. Reopening

A future reopening mechanism may be introduced through an explicit action such as:

```text
reopen
```

It must not be implemented by allowing arbitrary status PATCH operations.

---

## 72. State Machine Ownership

The WORK module owns the Task lifecycle definition.

Core owns:

```text
Identity
Authentication
Authorization primitives
Organization
Membership
```

Policy determines contextual restrictions.

---

## 73. Implementation Requirement

The implementation should represent transitions explicitly rather than scattering status checks throughout the codebase.

Conceptually:

```text
transition(
    task,
    action,
    actor,
    context
)
```

The transition engine should determine:

```text
allowed?
next_state?
required_conditions?
history_event?
```

---

## 74. Recommended Transition Definition

A transition definition should conceptually contain:

```text
from_state
action
to_state
permission
conditions
history_event
```

Example:

```text
from_state = in_progress
action = complete
to_state = completed
history_event = completed
```

---

## 75. Deterministic Behavior

Given the same:

```text
current state
+
action
+
authorization context
+
business context
```

the state machine should produce the same transition result.

---

## 76. Testing Requirement

Every valid transition must have at least one successful test.

Every invalid transition should have at least one rejection test.

---

## 77. Minimum Transition Tests

The implementation should test:

```text
draft → assigned
assigned → in_progress
in_progress → blocked
blocked → in_progress
in_progress → completed
draft → cancelled
assigned → cancelled
in_progress → cancelled
blocked → cancelled
completed → archived
cancelled → archived
```

---

## 78. Minimum Invalid Tests

The implementation should test:

```text
draft → completed
draft → archived
completed → in_progress
cancelled → completed
archived → in_progress
archived → completed
```

---

## 79. Authorization Tests

At minimum:

```text
unauthorized actor → rejected
authorized actor → accepted
out-of-scope actor → rejected
```

---

## 80. Concurrency Tests

The implementation should verify that concurrent transitions do not silently overwrite one another.

Example:

```text
Task.version = 5

Actor A → complete
Actor B → cancel
```

Exactly one transition should win according to transaction ordering.

---

## 81. Audit Tests

Every successful transition must produce the expected History event.

Example:

```text
complete
    ↓
Task.status = completed
    +
History.event_type = completed
```

---

## 82. Final State Machine Principle

The WORK lifecycle is:

```text
draft
  ↓
assigned
  ↓
in_progress
  ├── block → blocked → unblock → in_progress
  ├── complete → completed
  └── cancel → cancelled

completed → archived
cancelled → archived
```

No other transition exists in the initial system.

---

## 83. Final Architectural Rule

The WORK module must never become a collection of arbitrary status mutations.

It must remain a controlled state machine where:

```text
Action
+
Permission
+
Policy
+
Current State
+
Business Conditions
        ↓
Explicit Transition
        ↓
State Change
        +
History
```

This state machine is the authoritative lifecycle contract for WORK.

---

**End of WORK STATE MACHINE**
