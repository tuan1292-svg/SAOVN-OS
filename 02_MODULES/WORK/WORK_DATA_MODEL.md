# SAOVN-OS — WORK DATA MODEL

**Status:** Draft
**Layer:** Business Module
**Module:** WORK
**Depends On:** Identity, Organization, Membership, Role, Permission, Policy
**Related Specification:** WORK_MODULE_SPECIFICATION.md

---

## 1. Purpose

This document defines the logical data model for the WORK module.

The model exists to support the first operational workflow of SAOVN-OS:

```text
Create Task
    ↓
Assign
    ↓
Execute
    ↓
Track Progress
    ↓
Complete
```

The model must remain consistent with the Core architecture and must not duplicate Core identity or authorization data.

---

## 2. Data Model Principles

The WORK data model follows these principles:

1. Core entities remain authoritative for identity and authorization.
2. WORK owns Task execution state.
3. Historical attribution must be preserved.
4. Organizational boundaries must be explicit.
5. Current state and historical events are separate concepts.
6. Assignment is a first-class relationship.
7. Progress history is separate from current progress.
8. State transitions must be controlled.
9. Foreign-key relationships must preserve organizational integrity.
10. The model must remain extensible without unnecessary complexity.

---

## 3. Entity Overview

The initial WORK data model consists of:

```text
Task
Assignment
Progress Record
Task History
```

Conceptually:

```text
Organization
    │
    ├───────────────┐
    │               │
    ▼               ▼
  Task         Identity
    │               │
    ├──────┐        │
    │      │        │
    ▼      ▼        │
Assignment ─────────┘
    │
    ▼
Identity

Task
 ├── Progress Records
 └── History Records
```

---

## 4. Task

Task is the primary business entity.

A Task represents a unit of work that must be performed within an organizational context.

Conceptually:

```text
Task
├── identity
├── organization context
├── content
├── lifecycle state
├── responsibility
├── scheduling
└── timestamps
```

---

## 5. Task Identity

Required conceptual fields:

```text
id
```

`id` uniquely identifies the Task.

The identifier must be stable throughout the Task lifecycle.

---

## 6. Task ID Requirements

Task IDs must:

* be unique
* be server-generated
* never depend on client input
* remain stable after creation
* be safe for API resource identification

---

## 7. Organization Context

Every Task must belong to an Organization.

Conceptually:

```text
organization_id
```

This is a mandatory relationship for operational Tasks.

---

## 8. Department Context

A Task may optionally belong to a Department.

```text
department_id
```

The Department must belong to the same Organization context as the Task.

---

## 9. Team Context

A Task may optionally belong to a Team.

```text
team_id
```

The Team must belong to the same Organization context as the Task.

---

## 10. Project Context

A Task may optionally belong to a Project.

```text
project_id
```

Project support must remain optional for the initial WORK implementation.

---

## 11. Task Title

Required field:

```text
title
```

The title provides the primary human-readable identifier for the work.

The implementation should enforce a reasonable maximum length.

---

## 12. Task Description

Optional field:

```text
description
```

The description contains additional information required to understand or perform the Task.

---

## 13. Task Status

Required field:

```text
status
```

Initial supported values:

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

## 14. Status Authority

`status` represents the current authoritative lifecycle state.

It must not be reconstructed solely from history.

History records explain how the state changed.

---

## 15. Task Priority

Required or defaulted field:

```text
priority
```

Initial values:

```text
low
normal
high
urgent
```

The default should be:

```text
normal
```

unless organizational Policy defines another behavior.

---

## 16. Task Progress

Current progress:

```text
progress
```

The valid range is:

```text
0 <= progress <= 100
```

Progress should be stored as a numeric value.

---

## 17. Progress Precision

The first implementation should use integer percentage values:

```text
0
25
50
75
100
```

Decimal progress is not required for MVP.

---

## 18. Creator

Required relationship:

```text
creator_id
```

The Creator is the Identity that originally created the Task.

The value should normally be derived from the authenticated Session.

---

## 19. Owner

Optional or required according to implementation:

```text
owner_id
```

Owner represents the Identity responsible for managing the Task organizationally.

Owner is distinct from Creator and Assignee.

---

## 20. Assignee

The current primary Assignee should not be represented as the sole source of assignment history.

The authoritative assignment relationship belongs to the Assignment entity.

A Task may expose a derived current Assignee for convenience.

---

## 21. Due Date

Optional field:

```text
due_at
```

The value represents the target completion time.

---

## 22. Completion Time

Optional field:

```text
completed_at
```

This should be populated when the Task enters `completed`.

It should normally remain null for non-completed Tasks.

---

## 23. Archive Time

Optional field:

```text
archived_at
```

This should be populated when the Task enters `archived`.

---

## 24. Creation Time

Required:

```text
created_at
```

This records when the Task was created.

---

## 25. Update Time

Required:

```text
updated_at
```

This records the most recent current-state modification.

---

## 26. Version

Recommended field:

```text
version
```

The version supports optimistic concurrency control.

Example:

```text
version = 1
    ↓
update
    ↓
version = 2
```

---

## 27. Task Conceptual Schema

```text
tasks
├── id
├── organization_id
├── department_id
├── team_id
├── project_id
├── title
├── description
├── status
├── priority
├── progress
├── creator_id
├── owner_id
├── due_at
├── completed_at
├── archived_at
├── created_at
├── updated_at
└── version
```

---

## 28. Assignment

Assignment represents the relationship between a Task and an Identity responsible for performing the work.

Assignment must be modeled separately from Task because assignments have history and lifecycle.

---

## 29. Assignment Identity

Required:

```text
id
```

The Assignment identifier must be unique.

---

## 30. Assignment Task

Required:

```text
task_id
```

This references the Task being assigned.

---

## 31. Assignment Organization

Required:

```text
organization_id
```

This preserves organizational context and supports integrity checks.

---

## 32. Assignment Assignee

Required:

```text
assignee_id
```

This references the Identity responsible for execution.

---

## 33. Assignment Actor

Required:

```text
assigned_by
```

This references the Identity that performed the assignment operation.

---

## 34. Assignment Status

Initial values:

```text
active
completed
revoked
```

---

## 35. Assignment Time

Required:

```text
assigned_at
```

This records when the Assignment became active.

---

## 36. Assignment Start Time

Optional:

```text
started_at
```

This records when the Assignee began execution.

---

## 37. Assignment Completion Time

Optional:

```text
completed_at
```

This records when the Assignment lifecycle was completed.

---

## 38. Assignment Revocation Time

Optional:

```text
revoked_at
```

This records when the Assignment was revoked.

---

## 39. Assignment Timestamps

Standard timestamps:

```text
created_at
updated_at
```

---

## 40. Assignment Conceptual Schema

```text
task_assignments
├── id
├── task_id
├── organization_id
├── assignee_id
├── assigned_by
├── status
├── assigned_at
├── started_at
├── completed_at
├── revoked_at
├── created_at
└── updated_at
```

---

## 41. Active Assignment

An active Assignment is one whose:

```text
status = active
```

A Task should not accidentally contain multiple conflicting primary active assignments.

---

## 42. Reassignment

Reassignment should preserve the previous Assignment.

Example:

```text
Assignment A
    ↓
revoked

Assignment B
    ↓
active
```

This preserves history.

---

## 43. Assignment History

The Assignment table itself preserves the relationship history.

Task History additionally records the business event.

Both serve different purposes.

---

## 44. Assignment Integrity

An Assignment must satisfy:

```text
Assignment.task_id
    →
valid Task

Assignment.assignee_id
    →
valid Identity

Assignment.organization_id
    →
same Organization as Task
```

---

## 45. Identity Authority

WORK must not create its own Identity entity.

`creator_id`, `owner_id`, `assignee_id`, and `assigned_by` reference the Core Identity model.

---

## 46. Membership Validation

An Assignee must have a valid Membership relationship with the relevant Organization unless Policy explicitly supports another organizational relationship.

---

## 47. Department Integrity

If a Task references a Department:

```text
Task.department.organization
=
Task.organization
```

---

## 48. Team Integrity

If a Task references a Team:

```text
Task.team.organization
=
Task.organization
```

---

## 49. Project Integrity

If a Task references a Project:

```text
Task.project.organization
=
Task.organization
```

---

## 50. Owner Integrity

If an Owner is specified:

```text
Owner
    ↓
valid Identity
    ↓
valid organizational context
```

---

## 51. Creator Integrity

Creator must be a valid historical Identity reference.

The Creator should normally come from the authenticated actor.

---

## 52. Progress Record

Progress Record stores a historical progress update.

It is distinct from the current Task `progress`.

---

## 53. Progress Record Identity

Required:

```text
id
```

---

## 54. Progress Record Task

Required:

```text
task_id
```

---

## 55. Progress Record Actor

Required:

```text
actor_id
```

This identifies who submitted the progress update.

---

## 56. Progress Value

Required:

```text
progress
```

Valid range:

```text
0 <= progress <= 100
```

---

## 57. Progress Comment

Optional:

```text
comment
```

This allows the actor to explain the update.

---

## 58. Progress Timestamp

Required:

```text
created_at
```

This records when the progress update was submitted.

---

## 59. Progress Record Schema

```text
task_progress
├── id
├── task_id
├── actor_id
├── progress
├── comment
└── created_at
```

---

## 60. Current Progress

The current Task progress is stored on the Task.

Historical progress is stored in `task_progress`.

This avoids expensive reconstruction of current state.

---

## 61. Progress Update

A progress update should perform:

```text
Validate authorization
    ↓
Validate Task state
    ↓
Validate progress
    ↓
Update tasks.progress
    ↓
Create task_progress record
```

These operations should be transactionally consistent.

---

## 62. Progress Completion

When a Task becomes completed:

```text
progress = 100
```

A final Progress Record may also be recorded.

---

## 63. Task History

Task History stores important lifecycle and state-change events.

---

## 64. History Purpose

History answers:

```text
What happened?
Who did it?
When?
What changed?
```

---

## 65. History Identity

Required:

```text
id
```

---

## 66. History Task

Required:

```text
task_id
```

---

## 67. History Actor

Optional depending on event:

```text
actor_id
```

System-generated events may not always have a human actor.

---

## 68. History Event Type

Required:

```text
event_type
```

Initial values:

```text
created
assigned
reassigned
started
progress_updated
blocked
unblocked
completed
cancelled
archived
updated
```

---

## 69. History Old Value

Optional:

```text
old_value
```

This stores the previous value when applicable.

---

## 70. History New Value

Optional:

```text
new_value
```

This stores the new value when applicable.

---

## 71. History Metadata

Optional:

```text
metadata
```

Metadata may contain structured event-specific information.

It must not become an uncontrolled replacement for proper columns.

---

## 72. History Timestamp

Required:

```text
created_at
```

The timestamp must come from server-authoritative time.

---

## 73. History Schema

```text
task_history
├── id
├── task_id
├── actor_id
├── event_type
├── old_value
├── new_value
├── metadata
└── created_at
```

---

## 74. History Immutability

History records should be append-only.

Existing history should not be silently modified.

---

## 75. History Correction

If an historical correction is necessary, the system should record an additional corrective event rather than silently rewriting the original event.

---

## 76. Task Relationships

The initial relationships are:

```text
Organization
    │
    └──< Task

Task
    ├──< Assignment
    ├──< Progress Record
    └──< History Record

Identity
    ├──< created Tasks
    ├──< owned Tasks
    ├──< Assignments
    ├──< Progress Records
    └──< History Records
```

---

## 77. Cardinality

Initial cardinality:

```text
Organization 1 ─── N Task

Task 1 ─── N Assignment

Task 1 ─── N Progress Record

Task 1 ─── N History Record
```

---

## 78. Current Assignment Cardinality

For the MVP, a Task should have at most one active primary Assignment.

Historical Assignments may be unlimited.

---

## 79. Multiple Assignees

Multiple simultaneous Assignees are not required for MVP.

The model should not make future support impossible.

---

## 80. Soft Deletion

The initial Task model should prefer lifecycle states such as:

```text
cancelled
archived
```

over destructive deletion for important historical records.

---

## 81. Hard Deletion

Hard deletion should be restricted to explicitly authorized administrative or maintenance operations.

It must not be the normal Task lifecycle.

---

## 82. Deletion and History

If a Task is hard-deleted, the system must define how dependent historical records are handled.

For MVP, hard deletion should preferably be avoided.

---

## 83. Nullability

Fields should be nullable only when the business lifecycle genuinely allows absence.

Examples:

```text
department_id   → nullable
team_id         → nullable
project_id      → nullable
due_at          → nullable
completed_at    → nullable
archived_at     → nullable
```

---

## 84. Required Fields

Minimum Task fields:

```text
id
organization_id
title
status
priority
progress
creator_id
created_at
updated_at
version
```

---

## 85. Default Values

Recommended defaults:

```text
status   = draft
priority = normal
progress = 0
version  = 1
```

---

## 86. Task Creation Defaults

When a Task is created:

```text
status   = draft
priority = normal
progress = 0
version  = 1
```

unless explicit valid values are supplied.

---

## 87. Assignment Defaults

When an Assignment is created:

```text
status = active
```

with:

```text
assigned_at = current server time
```

---

## 88. Timestamp Authority

All timestamps must be generated or validated by the server.

The client must not be trusted to establish authoritative lifecycle times.

---

## 89. Time Representation

The implementation should use a consistent timezone-neutral representation for persisted timestamps.

User-facing rendering may convert timestamps to the relevant local timezone.

---

## 90. Status Constraints

Only valid status values may be persisted.

Unknown lifecycle states must be rejected unless explicitly introduced by a migration.

---

## 91. Priority Constraints

Only supported priority values may be persisted.

---

## 92. Progress Constraints

The database and application layers should both protect:

```text
0 <= progress <= 100
```

where supported by the chosen storage technology.

---

## 93. Version Constraints

Version must be positive.

```text
version >= 1
```

---

## 94. Foreign Key Integrity

Where relational storage is used, foreign keys should be used where practical.

Important relationships include:

```text
task.organization_id
task.creator_id
task.owner_id
assignment.task_id
assignment.assignee_id
assignment.assigned_by
progress.task_id
progress.actor_id
history.task_id
history.actor_id
```

---

## 95. Cross-Organization Validation

Foreign-key existence alone is insufficient for organizational isolation.

The application must additionally validate:

```text
Task.organization
=
Assignment.organization
=
related organizational resource
```

where applicable.

---

## 96. Assignment Organization Constraint

The Assignment organization must match the Task organization.

Conceptually:

```text
assignment.organization_id
=
task.organization_id
```

---

## 97. Progress Organization Context

Progress Records inherit organizational context from their Task.

The implementation does not necessarily need a duplicated `organization_id` field if the relationship is unambiguous.

---

## 98. History Organization Context

History Records inherit organizational context from their Task unless there is a specific reason to denormalize it.

---

## 99. Denormalization

Denormalized organizational fields may be introduced for performance or partitioning.

Any denormalized field must have a clearly defined synchronization rule.

---

## 100. Current State vs History

Current state belongs to Task:

```text
status
progress
priority
owner
due_at
```

History belongs to event records:

```text
status change
assignment change
progress change
completion
cancellation
```

---

## 101. Assignment vs History

Assignment represents a durable business relationship.

History represents the fact that a business event occurred.

They must not be treated as interchangeable.

---

## 102. Progress vs History

Progress Record represents a structured progress update.

Task History represents the lifecycle event.

A progress update may therefore produce:

```text
Progress Record
+
History Record
```

---

## 103. Completion Data

Completion should update:

```text
status
progress
completed_at
updated_at
version
```

and create the corresponding History event.

---

## 104. Cancellation Data

Cancellation should update:

```text
status
updated_at
version
```

and create a History event.

A cancellation reason may be represented through event metadata or a dedicated field in a future revision.

---

## 105. Archive Data

Archiving should update:

```text
status
archived_at
updated_at
version
```

and create a History event.

---

## 106. Assignment Data Flow

```text
Task
    ↓
create Assignment
    ↓
Assignment.status = active
    ↓
Task becomes assigned
    ↓
History = assigned
```

---

## 107. Reassignment Data Flow

```text
Current Assignment
    ↓
status = revoked
    ↓
New Assignment
    ↓
status = active
    ↓
History = reassigned
```

---

## 108. Start Data Flow

```text
Assignment
    ↓
started_at
    ↓
Task.status = in_progress
    ↓
History = started
```

---

## 109. Block Data Flow

```text
Task.status = blocked
    ↓
History = blocked
```

---

## 110. Unblock Data Flow

```text
Task.status = in_progress
    ↓
History = unblocked
```

---

## 111. Completion Data Flow

```text
Task.status = completed
Task.progress = 100
Task.completed_at = now
    ↓
History = completed
```

---

## 112. Archive Data Flow

```text
Task.status = archived
Task.archived_at = now
    ↓
History = archived
```

---

## 113. Task State Machine

Initial state machine:

```text
draft
  │
  ▼
assigned
  │
  ▼
in_progress
  │
  ├──────────────► blocked
  │                  │
  │                  ▼
  │              in_progress
  │
  ▼
completed
```

Alternative terminal path:

```text
draft / assigned / in_progress / blocked
                │
                ▼
             cancelled
```

Archived:

```text
completed / cancelled
       │
       ▼
   archived
```

---

## 114. State Validation

Every state transition must verify:

```text
current state
+
requested transition
+
authorization
```

---

## 115. State Transition Record

Every meaningful lifecycle transition should create a History record.

---

## 116. Invalid State Transition

Invalid transitions must fail without partially modifying Task state.

---

## 117. Transaction Boundary

The following should be atomic where applicable:

```text
Task state update
+
History creation
```

Likewise:

```text
Assignment mutation
+
Task update
+
History creation
```

---

## 118. Progress Transaction

Progress update should be atomic:

```text
Task.progress update
+
Progress Record
+
History Record
```

---

## 119. Reassignment Transaction

Reassignment should be atomic:

```text
Old Assignment revoked
+
New Assignment created
+
Task current assignment state updated if applicable
+
History created
```

---

## 120. Completion Transaction

Completion should be atomic:

```text
Task status update
+
progress = 100
+
completed_at
+
History
```

---

## 121. Concurrency

The data model must support safe concurrent operations.

Example:

```text
Manager A
    └── assign to B

Manager C
    └── assign to D
```

The final state must be deterministic and valid.

---

## 122. Optimistic Locking

The `version` field may be used as:

```text
UPDATE task
SET version = version + 1
WHERE id = ?
AND version = expected_version
```

The exact query syntax belongs to implementation.

---

## 123. Lost Update Prevention

Concurrent modifications must not silently overwrite newer changes.

---

## 124. Active Assignment Constraint

Where supported by the database, enforce or approximate:

```text
one active primary assignment per task
```

---

## 125. Indexing Principles

Indexes should support common Work queries.

Initial query patterns:

```text
Tasks by Organization
Tasks by Assignee
Tasks by Owner
Tasks by Status
Tasks by Due Date
Tasks by Project
Tasks by Department
Tasks by Team
```

---

## 126. Task Organization Index

Recommended:

```text
organization_id
```

This is a fundamental scope filter.

---

## 127. Assignee Index

Assignments should be indexed by:

```text
assignee_id
```

and preferably by active status where supported.

---

## 128. Task Status Index

Tasks should support efficient status filtering.

---

## 129. Due Date Index

Tasks should support efficient due-date queries for:

```text
due soon
overdue
```

---

## 130. History Index

History should support:

```text
task_id
created_at
```

to efficiently retrieve chronological Task history.

---

## 131. Progress Index

Progress records should support:

```text
task_id
created_at
```

for chronological progress history.

---

## 132. Assignment History Index

Assignments should support:

```text
task_id
assigned_at
```

for historical retrieval.

---

## 133. Query Scope

Every Task query must begin from an authorized organizational scope.

Conceptually:

```text
Authorized Scope
    ↓
Task Query
    ↓
Filters
    ↓
Pagination
```

not:

```text
All Tasks
    ↓
Filter in client
```

---

## 134. Client Filtering

Client-side filtering must never be treated as an authorization mechanism.

---

## 135. API Resource Mapping

The data model maps to API resources:

```text
Task
Assignment
Progress
History
```

The API should not expose internal storage details unnecessarily.

---

## 136. API Response Task

A Task response may include:

```text
id
title
description
status
priority
progress
creator
owner
assignee
organization
department
team
project
due_at
created_at
updated_at
```

The exact response shape belongs to API specification.

---

## 137. API Response Assignment

Assignment responses may include:

```text
id
task_id
assignee
status
assigned_at
started_at
completed_at
```

---

## 138. API Response Progress

Progress responses may include:

```text
id
task_id
actor
progress
comment
created_at
```

---

## 139. API Response History

History responses may include:

```text
id
task_id
actor
event_type
old_value
new_value
metadata
created_at
```

---

## 140. Data Exposure

The API must not expose:

```text
internal security metadata
unnecessary database fields
hidden Policy evaluation data
private implementation details
```

---

## 141. Audit Separation

Task History is operational history.

Audit is security/compliance history.

They may overlap in events but serve different purposes.

---

## 142. Task History Examples

```text
created
assigned
progress_updated
completed
```

---

## 143. Audit Examples

```text
unauthorized access attempt
permission-sensitive mutation
administrative reassignment
```

---

## 144. Identity Deactivation

If an Identity becomes inactive:

```text
Historical records remain valid.
```

Existing Assignment behavior must be determined by business Policy.

---

## 145. Membership Removal

Removing Membership should not erase:

```text
creator history
assignment history
progress history
task history
```

---

## 146. Organization Suspension

Organization suspension may prevent new Work operations according to Policy.

Existing Work data remains preserved.

---

## 147. Data Retention

The system should define retention policies separately.

WORK should not silently delete historical data because of retention assumptions.

---

## 148. Data Migration

Future schema changes must preserve:

```text
Task identity
Assignment history
Progress history
Task history
```

where practical.

---

## 149. Backward Compatibility

API and database migrations should avoid breaking historical Task records.

---

## 150. Extensibility

Future entities may include:

```text
Task Comment
Task Attachment
Task Dependency
Task Subtask
Task Template
Recurring Task
```

These should reference Task rather than modify the fundamental identity model unnecessarily.

---

## 151. Future Multiple Assignee Support

If multiple Assignees are introduced, Assignment already provides the correct extension point.

The Task should not need a fundamentally different identity model.

---

## 152. Future Project Support

Project association can be expanded without changing the core Task lifecycle.

---

## 153. Future Workflow Support

A future workflow engine may control allowed state transitions.

The current model should remain compatible with explicit state transitions.

---

## 154. Future Approval Support

Approval records may reference Task without becoming part of the Task identity.

---

## 155. Future Notification Support

Notifications may reference:

```text
task_id
assignment_id
event_id
```

depending on the notification architecture.

---

## 156. Future Reporting

Reporting can aggregate:

```text
tasks
assignments
progress
history
```

without changing their fundamental semantics.

---

## 157. Future Analytics

Analytics may consume event streams derived from Task lifecycle changes.

---

## 158. Data Ownership

WORK owns:

```text
Task
Assignment
Progress Record
Task History
```

Core owns:

```text
Identity
Organization
Membership
Role
Permission
Policy
```

---

## 159. No Duplicate Identity

The following must never become separate WORK-owned user records:

```text
creator
owner
assignee
assigned_by
actor
```

They reference Core Identity.

---

## 160. No Duplicate Authorization

WORK must not create its own independent:

```text
role
permission
policy
```

system.

---

## 161. Authorization References

The data model only references authorization concepts.

Authorization decisions remain in the Core Access Control layer.

---

## 162. Security Boundary

The data model must support:

```text
Organization Isolation
+
Authorization
+
Historical Attribution
+
State Integrity
```

---

## 163. Minimum Production Integrity

Before implementation is considered production-ready:

```text
[ ] Task organization integrity
[ ] Identity references validated
[ ] Assignment integrity
[ ] Progress range validation
[ ] Status validation
[ ] History append-only behavior
[ ] Concurrency protection
[ ] Authorization boundary
[ ] Organizational isolation
```

---

## 164. MVP Tables

The initial implementation should target:

```text
tasks
task_assignments
task_progress
task_history
```

No additional WORK table is required unless implementation reveals a concrete need.

---

## 165. MVP Task Fields

```text
id
organization_id
title
description
status
priority
progress
creator_id
owner_id
due_at
completed_at
archived_at
created_at
updated_at
version
```

---

## 166. MVP Assignment Fields

```text
id
task_id
organization_id
assignee_id
assigned_by
status
assigned_at
started_at
completed_at
revoked_at
created_at
updated_at
```

---

## 167. MVP Progress Fields

```text
id
task_id
actor_id
progress
comment
created_at
```

---

## 168. MVP History Fields

```text
id
task_id
actor_id
event_type
old_value
new_value
metadata
created_at
```

---

## 169. MVP Relationship Diagram

```text
┌──────────────────┐
│   Organization   │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│       Task       │
├──────────────────┤
│ id               │
│ organization_id  │
│ title            │
│ status           │
│ priority         │
│ progress         │
│ creator_id       │
│ owner_id         │
│ due_at           │
│ version          │
└──────┬─────┬─────┘
       │     │
       │     │
       ▼     ▼
┌──────────┐ ┌───────────────┐
│Progress  │ │Task History   │
└──────────┘ └───────────────┘
       │
       │
       ▼
┌──────────────────┐
│   Assignment     │
├──────────────────┤
│ id               │
│ task_id          │
│ assignee_id      │
│ assigned_by      │
│ status           │
│ assigned_at      │
└──────────────────┘
```

---

## 170. Final Data Principle

The WORK data model exists to preserve one simple truth:

```text
A piece of work must have
a clear identity,
an organizational context,
a responsible actor,
a measurable state,
and a traceable history.
```

The model therefore follows:

```text
Task
 ↓
Assignment
 ↓
Execution
 ↓
Progress
 ↓
History
 ↓
Completion
```

This is the minimum durable data foundation required for the first real operational system of SAOVN-OS.

---

**End of WORK DATA MODEL**
