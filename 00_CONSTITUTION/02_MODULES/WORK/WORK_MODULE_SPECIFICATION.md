# SAOVN-OS — Work Module Specification

**Status:** Draft
**Layer:** Business Module
**Module:** WORK
**Depends On:** Identity, Account, Authentication, Session, Organization, Department, Membership, Role, Permission, Policy
**Primary Purpose:** Online work assignment, task management, progress tracking, responsibility tracking, and work lifecycle management

---

## 1. Purpose

The WORK module is the first major business module of SAOVN-OS.

Its primary purpose is to provide a centralized organizational workspace for:

* creating work
* assigning work
* tracking work
* updating progress
* monitoring responsibility
* managing work status
* completing work
* reviewing work history

The module must provide a clear operational flow:

```text
Create
    ↓
Assign
    ↓
Execute
    ↓
Update Progress
    ↓
Review
    ↓
Complete
```

---

## 2. Core Principle

WORK exists to answer:

```text
What needs to be done?
Who is responsible?
When should it be done?
What is the current state?
How far has it progressed?
What happened during its lifecycle?
```

---

## 3. Module Boundary

WORK owns work execution.

WORK does not own:

* Identity
* Authentication
* Session
* Organization identity
* Role definitions
* Permission definitions
* Policy engine
* unrelated accounting
* unrelated HR records
* unrelated communication systems

WORK consumes Core services and models.

---

## 4. First User Experience

The initial operational experience should be:

```text
Login
    ↓
Authenticated Session
    ↓
Organization Context
    ↓
WORK
    ↓
My Work
    ↓
Tasks
```

A user should be able to understand their current work without navigating through unrelated system areas.

---

## 5. Work Model

The fundamental business object is a Work Item.

For the initial implementation, the primary Work Item is:

```text
Task
```

Conceptually:

```text
Work
└── Task
```

Future Work types may be added without invalidating the initial Task model.

---

## 6. Task Purpose

A Task represents a unit of work that must be performed by one or more responsible actors within an organizational context.

A Task should answer:

```text
What?
Who?
When?
Why?
Status?
Progress?
```

---

## 7. Task Identity

Each Task must have a stable unique identifier.

Conceptually:

```text
Task
├── id
├── organization_id
├── title
├── description
├── status
├── priority
├── creator_id
├── owner_id
├── due_at
├── created_at
└── updated_at
```

The final database representation belongs to implementation.

---

## 8. Task Title

Every Task should have a concise title.

The title identifies the work item in lists, dashboards, notifications, and detail views.

---

## 9. Task Description

A Task may contain a detailed description.

The description provides the context necessary for execution.

It should not be required to duplicate information already represented by structured fields.

---

## 10. Task Creator

The Creator is the Identity that created the Task.

Conceptually:

```text
Creator
    ↓
Identity
```

Creator is historical attribution.

Creator does not automatically become Owner or Assignee.

---

## 11. Task Owner

The Owner is the Identity responsible for managing the Task from the organizational perspective.

Owner and Assignee are separate concepts.

```text
Owner
    ≠
Assignee
```

unless explicitly configured otherwise.

---

## 12. Assignee

An Assignee is the Identity responsible for performing the assigned work.

A Task may initially support one primary Assignee.

Future versions may support multiple Assignees.

---

## 13. Assignment

Assignment represents the relationship between a Task and an Assignee.

Conceptually:

```text
Task
    ↓
Assignment
    ↓
Identity
```

Assignment should be a first-class business concept rather than merely a field on Task.

---

## 14. Assignment History

Assignment changes should be traceable.

Example:

```text
Task
    ↓
Assigned to A
    ↓
Reassigned to B
    ↓
Reassigned to C
```

The system should preserve this history where required.

---

## 15. Assignment State

An Assignment may have a lifecycle.

Initial conceptual states:

```text
active
completed
revoked
```

The exact lifecycle may evolve with implementation.

---

## 16. Task Status

Task status represents the current lifecycle state of the Task.

Initial status set:

```text
draft
assigned
in_progress
blocked
completed
cancelled
archived
```

The implementation may refine these states.

---

## 17. Draft

`draft` means the Task exists but is not yet active for execution.

Example:

```text
Create Task
    ↓
draft
```

---

## 18. Assigned

`assigned` means the Task has been assigned to an actor but execution has not yet begun.

```text
draft
    ↓
assigned
```

---

## 19. In Progress

`in_progress` means execution has started.

```text
assigned
    ↓
in_progress
```

---

## 20. Blocked

`blocked` means execution cannot currently continue because of a blocking condition.

A blocked Task remains active unless explicitly cancelled or completed.

---

## 21. Completed

`completed` means the required work has been completed.

```text
in_progress
    ↓
completed
```

Completion should be explicitly recorded.

---

## 22. Cancelled

`cancelled` means the Task will no longer be executed.

Cancellation is distinct from completion.

```text
active
    ↓
cancelled
```

---

## 23. Archived

`archived` means the Task is retained for historical or reference purposes and is no longer part of active Work.

---

## 24. Status Transition

Status changes must follow valid transitions.

Conceptually:

```text
draft
  ↓
assigned
  ↓
in_progress
  ↓
completed
```

Alternative transitions may include:

```text
in_progress
    ↓
blocked

blocked
    ↓
in_progress

active
    ↓
cancelled

completed
    ↓
archived
```

The final state machine must be explicitly implemented.

---

## 25. Invalid Transition

The system must reject invalid transitions.

Example:

```text
draft
    ↓
completed
```

if the transition is not permitted by the configured lifecycle.

---

## 26. Progress

Progress represents the execution state of a Task.

Initial representation:

```text
0 → 100
```

where:

```text
0
=
not started

100
=
complete
```

---

## 27. Progress Semantics

Progress should be numeric and monotonic during normal execution unless a deliberate correction is permitted.

Example:

```text
10%
    ↓
30%
    ↓
60%
    ↓
100%
```

---

## 28. Progress and Status

Progress and Status are related but distinct.

Example:

```text
Status:
in_progress

Progress:
60%
```

A Task may be:

```text
blocked
```

while retaining:

```text
60%
```

---

## 29. Progress at Completion

A completed Task should normally have:

```text
progress = 100
```

unless the system explicitly supports alternative completion semantics.

---

## 30. Due Date

A Task may have a due date/time.

Conceptually:

```text
due_at
```

The due date is used for:

* planning
* monitoring
* notifications
* overdue detection
* reporting

---

## 31. Overdue

A Task becomes overdue when:

```text
current time > due_at
```

and the Task is still active.

Overdue status should be derived from authoritative time and Task state rather than manually entered.

---

## 32. Priority

A Task may have a priority.

Initial conceptual levels:

```text
low
normal
high
urgent
```

Priority affects visibility and planning but does not itself grant authorization.

---

## 33. Priority and Policy

Priority is a business attribute.

It must not be used as a hidden authorization mechanism.

---

## 34. Organization Scope

Every operational Task must belong to an Organization.

Conceptually:

```text
Task
    ↓
Organization
```

A Task must not silently exist outside an organizational context.

---

## 35. Department Scope

A Task may belong to a Department.

This enables Department-level Work organization and Policy evaluation.

---

## 36. Team Scope

A Task may belong to a Team.

Team association may be used for:

* assignment
* filtering
* visibility
* reporting
* Policy evaluation

---

## 37. Project Scope

A Task may belong to a Project.

The Project model will be introduced separately.

WORK should support Project association without making Project implementation a prerequisite for basic Task operation.

---

## 38. Organizational Hierarchy

A Task may therefore be represented conceptually as:

```text
Organization
    ↓
Department
    ↓
Team
    ↓
Project
    ↓
Task
```

Not every Task must use every level.

---

## 39. Task Scope Rules

A Task must not reference organizational resources outside its valid Organization boundary.

For example:

```text
Task Organization
        =
Project Organization
        =
Assignment Organization
```

where those relationships exist.

---

## 40. Task Creation

Task creation requires authorization.

Conceptually:

```text
Actor
    ↓
work.task.create
    ↓
Policy
    ↓
Create Task
```

---

## 41. Task Creation Inputs

Initial creation may require:

```text
title
description
priority
due_at
department_id
team_id
project_id
owner_id
assignee_id
```

Only applicable fields should be required.

---

## 42. Creator Authorization

The creator must possess the relevant Permission.

Policy determines whether the actor may create a Task within the selected organizational scope.

---

## 43. Task Assignment

Assignment is a primary WORK operation.

Conceptually:

```text
Task
    ↓
Assign
    ↓
Assignee
```

---

## 44. Assignment Authorization

Assignment requires:

```text
work.task.assign
```

plus applicable Policy conditions.

Possible conditions include:

```text
same Organization
valid Membership
eligible Assignee
authorized Project
authorized Department
authorized Team
```

---

## 45. Assignee Eligibility

Before assignment, the system should verify that the target Identity is eligible.

Initial conditions:

```text
Identity exists
Membership is active
Organization is compatible
```

Additional eligibility may be introduced later.

---

## 46. Assignment to Self

Self-assignment may be permitted when Policy allows it.

The system must not assume that self-assignment is always allowed or always forbidden.

---

## 47. Reassignment

Reassignment changes the responsible Assignee.

Conceptually:

```text
Assignee A
    ↓
Reassign
    ↓
Assignee B
```

Reassignment should be separately authorized where necessary.

---

## 48. Reassignment History

The system should retain:

```text
previous assignee
new assignee
changed by
changed at
reason
```

where applicable.

---

## 49. Task Start

A Task may transition from:

```text
assigned
    ↓
in_progress
```

The transition may be triggered by the Assignee or an authorized actor.

---

## 50. Task Progress Update

An active Assignee may update progress if Policy permits.

Conceptually:

```text
Assignee
    ↓
work.task.progress.update
    ↓
Policy
    ↓
Update Progress
```

---

## 51. Progress Update Validation

Progress must satisfy:

```text
0 <= progress <= 100
```

Invalid values must be rejected.

---

## 52. Progress History

Important progress updates may be recorded.

Example:

```text
10%
20%
35%
60%
80%
100%
```

History enables later reporting and audit.

---

## 53. Progress Comment

A progress update may include an optional comment.

Example:

```text
Progress:
60%

Comment:
Backend integration completed.
```

---

## 54. Blocked Work

A Task may be marked blocked when execution cannot continue.

The system should capture an optional blocking reason.

Conceptually:

```text
blocked
    ↓
blocking_reason
```

---

## 55. Unblocking

A blocked Task may return to active execution.

```text
blocked
    ↓
in_progress
```

The transition must be authorized.

---

## 56. Completion

A Task may be completed when the required work is finished.

Conceptually:

```text
in_progress
    ↓
complete
```

The exact completion rules must be enforced by the Work state machine.

---

## 57. Completion Authorization

Completion requires:

```text
work.task.complete
```

plus applicable Policy.

---

## 58. Completion Validation

Before completion, the system may validate:

```text
Task is active
Actor is authorized
Required assignment exists
Required workflow conditions are satisfied
```

The exact business rules may evolve.

---

## 59. Cancellation

A Task may be cancelled when the work is no longer required.

Cancellation should be separately authorized.

---

## 60. Cancellation Reason

Cancellation should support an optional reason.

This improves operational clarity and historical understanding.

---

## 61. Archiving

Archiving removes a completed or cancelled Task from active Work views while retaining its history.

---

## 62. Task Detail

A Task detail view should provide:

```text
Title
Description
Status
Priority
Progress
Creator
Owner
Assignee
Department
Team
Project
Due Date
Created At
Updated At
History
```

---

## 63. My Work

The first major WORK view should be:

```text
My Work
```

It should show Tasks relevant to the current actor.

Possible categories:

```text
Assigned to me
Created by me
Owned by me
Due soon
Overdue
Blocked
Completed
```

---

## 64. Assigned to Me

This view displays Tasks for which the current Identity is an active Assignee.

---

## 65. Created by Me

This view displays Tasks created by the current Identity.

---

## 66. Owned by Me

This view displays Tasks managed by the current Identity.

---

## 67. Due Soon

This view displays active Tasks approaching their due time.

---

## 68. Overdue Work

This view displays active Tasks whose due date has passed.

---

## 69. Blocked Work

This view displays Tasks currently blocked.

---

## 70. Completed Work

This view displays completed Tasks accessible to the current actor.

---

## 71. Work Dashboard

A future dashboard may summarize:

```text
My Tasks
Assigned Tasks
Overdue
Blocked
Completed
Progress
```

The initial implementation should remain focused on core Task operations.

---

## 72. Task List

The Task list should support:

* search
* filtering
* sorting
* pagination
* status filtering
* priority filtering
* assignee filtering
* due-date filtering

All results must respect authorization.

---

## 73. Search

Task search must only return Tasks visible to the current actor.

Search must not become an authorization bypass.

---

## 74. Filtering

Initial filters:

```text
status
priority
assignee
owner
department
team
project
due date
```

---

## 75. Sorting

Initial sorting options:

```text
created_at
updated_at
due_at
priority
progress
```

---

## 76. Pagination

Task lists should support pagination.

Pagination must preserve authorization scope across every page.

---

## 77. Task Detail Authorization

Viewing a Task requires:

```text
work.task.view
```

plus applicable Policy.

---

## 78. Task Update Authorization

Updating a Task requires:

```text
work.task.update
```

plus applicable Policy.

---

## 79. Task Delete Authorization

Deleting a Task requires:

```text
work.task.delete
```

plus applicable Policy.

Deletion should be treated as a higher-impact operation than normal editing.

---

## 80. Task Assign Authorization

Assigning a Task requires:

```text
work.task.assign
```

plus applicable Policy.

---

## 81. Task Reassign Authorization

Reassignment may require:

```text
work.task.reassign
```

or an equivalent explicit authorization capability.

It should not automatically be assumed to be identical to normal Task update permission.

---

## 82. Task Progress Authorization

Updating progress requires:

```text
work.task.progress.update
```

plus applicable Policy.

---

## 83. Task Complete Authorization

Completing a Task requires:

```text
work.task.complete
```

plus applicable Policy.

---

## 84. Task Cancel Authorization

Cancelling a Task requires:

```text
work.task.cancel
```

plus applicable Policy.

---

## 85. Task Archive Authorization

Archiving a Task requires:

```text
work.task.archive
```

plus applicable Policy.

---

## 86. Permission Set

The initial WORK Permission namespace should be:

```text
work.task.view
work.task.create
work.task.update
work.task.delete
work.task.assign
work.task.reassign
work.task.progress.update
work.task.complete
work.task.cancel
work.task.archive
```

Additional permissions may be added when required.

---

## 87. Permission Naming

Permissions should use stable machine-readable identifiers.

Recommended format:

```text
work.task.<action>
```

The permission name must not encode contextual Policy.

---

## 88. Policy Integration

WORK delegates contextual authorization to Core Access Control.

Conceptually:

```text
WORK
    ↓
Authorization Request
    ↓
Permission
    ↓
Policy
    ↓
Decision
```

---

## 89. Authorization Context

A WORK authorization request may include:

```text
actor
organization
task
project
department
team
assignment
action
```

Only required context should be loaded.

---

## 90. Create Task Flow

Initial flow:

```text
User
    ↓
Open WORK
    ↓
Create Task
    ↓
Enter Task Information
    ↓
Submit
    ↓
Authenticate
    ↓
Permission Check
    ↓
Policy Check
    ↓
Validate
    ↓
Create Task
    ↓
Return Task
```

---

## 91. Assign Task Flow

Initial flow:

```text
Open Task
    ↓
Assign
    ↓
Select Assignee
    ↓
Permission Check
    ↓
Policy Check
    ↓
Validate Assignee
    ↓
Create Assignment
    ↓
Update Task
    ↓
Record History
```

---

## 92. Progress Flow

Initial flow:

```text
My Work
    ↓
Open Task
    ↓
Update Progress
    ↓
Permission Check
    ↓
Policy Check
    ↓
Validate Progress
    ↓
Save Progress
    ↓
Record Progress History
```

---

## 93. Completion Flow

Initial flow:

```text
Task
    ↓
Complete
    ↓
Permission Check
    ↓
Policy Check
    ↓
Validate State
    ↓
Set Progress = 100
    ↓
Set Status = completed
    ↓
Record History
```

---

## 94. Reassignment Flow

Initial flow:

```text
Task
    ↓
Reassign
    ↓
Select New Assignee
    ↓
Authorization
    ↓
Eligibility Check
    ↓
Close Previous Assignment
    ↓
Create New Assignment
    ↓
Record History
```

---

## 95. Blocking Flow

Initial flow:

```text
Task
    ↓
Mark Blocked
    ↓
Authorization
    ↓
Validate State
    ↓
Save Blocking Reason
    ↓
Status = blocked
    ↓
Record History
```

---

## 96. Unblocking Flow

Initial flow:

```text
Blocked Task
    ↓
Resume
    ↓
Authorization
    ↓
Validate State
    ↓
Status = in_progress
    ↓
Record History
```

---

## 97. Task Lifecycle History

The system should record significant lifecycle changes.

Examples:

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
```

---

## 98. Work History

History should answer:

```text
What happened?
Who did it?
When?
What changed?
```

---

## 99. History Attribution

Every significant event should identify the actor responsible for the change where applicable.

---

## 100. History Timestamp

History events must use server-authoritative timestamps.

---

## 101. History Immutability

Historical events should not be silently rewritten.

Corrections should produce explicit corrective records where necessary.

---

## 102. Work Comments

Tasks may support comments.

Comments may be used for:

```text
clarification
progress updates
handover
blocking reasons
completion notes
```

Comment implementation may be separated into a later module.

---

## 103. Work Attachments

Future versions may support Task attachments.

Attachment storage is outside the core Task lifecycle.

---

## 104. Work Notifications

Future versions may notify actors when:

```text
Task assigned
Task reassigned
Task approaching due date
Task overdue
Task blocked
Task completed
```

Notification delivery is separate from Task state.

---

## 105. Notification Authorization

Notifications must not expose Tasks outside the recipient's authorized scope.

---

## 106. Work Events

WORK may publish domain events.

Initial conceptual events:

```text
TaskCreated
TaskAssigned
TaskReassigned
TaskStarted
TaskProgressUpdated
TaskBlocked
TaskUnblocked
TaskCompleted
TaskCancelled
TaskArchived
```

---

## 107. Event Consumers

Other modules may consume Work events.

Examples:

```text
Notification
Audit
Reporting
Analytics
```

---

## 108. Event Attribution

Work events should preserve actor attribution.

Conceptually:

```text
event
├── actor_id
├── organization_id
├── resource_id
├── timestamp
└── payload
```

---

## 109. Event Reliability

Important Work events should be published reliably.

The exact event delivery architecture belongs to implementation.

---

## 110. Work Transactions

Operations that change multiple related records should be atomic.

Example:

```text
Reassignment
    ↓
Close Previous Assignment
    +
Create New Assignment
    +
Update Task
    +
Record History
```

These operations should be transactionally consistent.

---

## 111. Concurrency

The Work module must handle concurrent updates.

Example:

```text
Manager A
    ↓
Assign Task to B

Manager C
    ↓
Assign Task to D
```

The system must prevent inconsistent final state.

---

## 112. Optimistic Concurrency

The implementation may use versioning or another concurrency strategy.

The chosen strategy must prevent silent lost updates.

---

## 113. Task Version

A Task may maintain an internal version.

Conceptually:

```text
version = 1
    ↓
update
    ↓
version = 2
```

This can help detect concurrent modifications.

---

## 114. Progress Concurrency

Two simultaneous Progress updates must not silently overwrite each other without an intentional resolution strategy.

---

## 115. Assignment Concurrency

A Task should not accidentally end up with multiple conflicting primary active assignments.

---

## 116. State Concurrency

State transitions should verify the current state before applying the new state.

Example:

```text
Expected:
in_progress

Actual:
completed

Requested:
blocked

Result:
reject or resolve according to state rules
```

---

## 117. Data Integrity

WORK must maintain referential integrity between:

```text
Task
Assignment
Identity
Organization
Department
Team
Project
History
```

---

## 118. Orphan Prevention

A Task must not reference nonexistent organizational resources.

---

## 119. Assignment Integrity

An Assignment must reference:

```text
valid Task
valid Identity
valid Organization context
```

---

## 120. Assignment Organization

The Assignee must belong to a valid organizational context compatible with the Task.

---

## 121. Historical Integrity

Historical Work records should remain attributable even when the current organizational relationship changes.

---

## 122. Deleted Identity

If an Identity is deactivated or removed from active Membership, historical Task records should retain the historical attribution required by the system.

---

## 123. Removed Membership

Removing Membership must not delete historical Work records.

Current authorization may change, but historical attribution remains.

---

## 124. Organization Suspension

If an Organization becomes suspended, active Work operations may be restricted according to Policy.

Historical Work remains preserved.

---

## 125. Project Dependency

Basic Task creation should not require full Project functionality.

The Work module should support:

```text
Task without Project
```

where organizational rules permit it.

---

## 126. Optional Project Association

A Task may optionally reference a Project.

This keeps the initial Work module usable before the Project module is complete.

---

## 127. Department Assignment

A Task may optionally reference a Department.

---

## 128. Team Assignment

A Task may optionally reference a Team.

---

## 129. Ownership Rules

Owner is responsible for management.

Assignee is responsible for execution.

The initial model should preserve this distinction.

---

## 130. Creator Rules

Creator is responsible for originating the Task.

Creator does not automatically become:

```text
Owner
```

or:

```text
Assignee
```

unless explicitly configured.

---

## 131. Manager Work

A manager may need a view of:

```text
Tasks created
Tasks owned
Tasks assigned to team
Overdue tasks
Blocked tasks
Completed tasks
```

Authorization determines which Tasks are visible.

---

## 132. Member Work

A normal member should primarily see:

```text
Tasks assigned to me
Tasks created by me
Tasks relevant to my authorized scope
```

---

## 133. Work Separation

The system must not expose all organizational Tasks to every user by default.

Visibility is controlled by Permission and Policy.

---

## 134. Default Visibility

Default visibility should be conservative.

The system should prefer:

```text
authorized scope
```

over:

```text
global visibility
```

---

## 135. Task Ownership Visibility

Owner-based visibility may allow managers to view Tasks they manage.

---

## 136. Assignee Visibility

Assignee-based visibility may allow actors to view Tasks assigned to them.

---

## 137. Creator Visibility

Creator-based visibility may allow actors to view Tasks they created.

---

## 138. Organization Administrator Visibility

An authorized Organization administrator may have broader visibility according to Role, Permission, and Policy.

Administrative visibility must still respect organizational boundaries.

---

## 139. Global Administrator

If SAOVN-OS later supports system-wide administration, global authority must be explicitly modeled.

It must not be inferred from ordinary Organization roles.

---

## 140. Work API Boundary

The implementation should expose a clean API boundary.

Conceptual operations:

```text
createTask
getTask
listTasks
updateTask
deleteTask
assignTask
reassignTask
updateProgress
startTask
blockTask
unblockTask
completeTask
cancelTask
archiveTask
```

---

## 141. Create Task API

Conceptual:

```text
POST /work/tasks
```

The actual API versioning strategy belongs to implementation.

---

## 142. Get Task API

Conceptual:

```text
GET /work/tasks/{task_id}
```

---

## 143. List Tasks API

Conceptual:

```text
GET /work/tasks
```

with supported filters.

---

## 144. Update Task API

Conceptual:

```text
PATCH /work/tasks/{task_id}
```

---

## 145. Assign Task API

Conceptual:

```text
POST /work/tasks/{task_id}/assign
```

---

## 146. Reassign Task API

Conceptual:

```text
POST /work/tasks/{task_id}/reassign
```

---

## 147. Progress API

Conceptual:

```text
POST /work/tasks/{task_id}/progress
```

---

## 148. Complete API

Conceptual:

```text
POST /work/tasks/{task_id}/complete
```

---

## 149. Cancel API

Conceptual:

```text
POST /work/tasks/{task_id}/cancel
```

---

## 150. Archive API

Conceptual:

```text
POST /work/tasks/{task_id}/archive
```

---

## 151. API Authorization

Every protected endpoint must perform:

```text
Authentication
    ↓
Permission
    ↓
Policy
    ↓
Business Validation
```

---

## 152. API Input Validation

Input validation must reject malformed or invalid data before mutation.

---

## 153. API Resource Resolution

The server must resolve Task resources from authoritative storage.

Client-provided resource metadata must not be trusted.

---

## 154. API Error Semantics

Errors should distinguish where necessary between:

```text
authentication failure
authorization failure
validation failure
resource not found
conflict
state transition failure
```

The implementation should avoid leaking unauthorized resource existence.

---

## 155. Work Database Concept

The initial database may contain conceptual entities:

```text
tasks
task_assignments
task_progress
task_history
```

Additional tables may be introduced later.

---

## 156. Task Table Concept

Conceptual fields:

```text
id
organization_id
department_id
team_id
project_id
title
description
status
priority
progress
creator_id
owner_id
due_at
created_at
updated_at
completed_at
archived_at
version
```

This is a conceptual model, not a final migration.

---

## 157. Assignment Table Concept

Conceptual fields:

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

## 158. Progress Table Concept

Conceptual fields:

```text
id
task_id
actor_id
progress
comment
created_at
```

---

## 159. History Table Concept

Conceptual fields:

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

## 160. Database Authority

The database is authoritative for current Task state.

Caches and derived views must not become the source of truth.

---

## 161. Derived Work Views

Future dashboards may derive:

```text
overdue
due soon
completion rate
workload
```

from authoritative Task data.

---

## 162. Workload

A future Workload feature may summarize active assignments per Identity.

Example:

```text
Member A
    ↓
8 active Tasks
```

Workload does not itself determine authorization.

---

## 163. Workload and Assignment

Workload should be derived from active Assignments and Task state.

---

## 164. Workload Limits

Future Policy may restrict assigning more work when workload thresholds are reached.

Example:

```text
Actor:
Manager

Target:
Member A

Current workload:
20 Tasks

Policy:
Assignment requires additional approval.
```

This is future functionality.

---

## 165. Due Date Rules

The system may later prevent or warn about invalid due dates.

For example:

```text
due_at < created_at
```

may be rejected.

---

## 166. Timezone

Date/time values should use a consistent server representation.

User-facing rendering may use the user's applicable timezone.

---

## 167. Deadline Accuracy

Deadline comparisons must use authoritative server time.

---

## 168. Overdue Calculation

Overdue should be derived from:

```text
Task is active
AND
due_at has passed
```

Completed and cancelled Tasks should not remain operationally overdue.

---

## 169. Task Notifications

Notifications should be event-driven where possible.

Example:

```text
TaskAssigned
    ↓
Notification
```

---

## 170. Notification Timing

Notifications may be immediate or scheduled.

Notification scheduling belongs to the Notification subsystem.

---

## 171. Audit

Security-sensitive Work operations should produce Audit records.

Examples:

```text
assignment
reassignment
completion
cancellation
deletion
permission-sensitive mutation
```

---

## 172. Audit Boundary

WORK produces relevant domain events.

Audit consumes or records them according to the Core Audit design.

---

## 173. Reporting

Future Reporting may consume Work data.

Reporting must respect the same authorization boundaries.

---

## 174. Analytics

Future Analytics may calculate:

```text
completion rate
average completion time
overdue rate
workload
```

Analytics must not expose unauthorized organizational data.

---

## 175. Search Index

A future search system may index Tasks.

The index must preserve authorization boundaries.

---

## 176. Cache

A future cache may accelerate Task retrieval.

Cached data must remain within the same authorization rules as primary storage.

---

## 177. Work Module Security

Security requirements include:

```text
server-side authorization
organization isolation
input validation
resource validation
state validation
auditability
safe error handling
concurrency protection
```

---

## 178. No Client Trust

The client must not be trusted for:

```text
creator_id
organization_id
owner_id
permission
role
policy decision
```

The server derives or validates these values.

---

## 179. Creator Identity

Creator should normally come from the authenticated actor.

---

## 180. Organization Context

Organization context should come from the authenticated Membership context and validated resource relationships.

---

## 181. Owner Validation

Owner must be a valid authorized Identity within the relevant organizational scope.

---

## 182. Assignee Validation

Assignee must be eligible under the applicable Work and Policy rules.

---

## 183. Bulk Assignment

Future versions may support assigning multiple Tasks at once.

Bulk operations require authorization for the entire operation.

---

## 184. Bulk Completion

Future versions may support bulk completion.

Bulk completion must validate each Task and preserve authorization boundaries.

---

## 185. Bulk Update

Future versions may support bulk updates.

Bulk updates must not bypass individual resource constraints.

---

## 186. Work Import

Future versions may support importing Tasks.

Imports must use an explicit authorization context and validation pipeline.

---

## 187. Work Export

Future versions may support exporting Tasks.

Exports require explicit authorization.

---

## 188. Work Templates

Future versions may support Task Templates.

Templates are separate from active Tasks.

---

## 189. Recurring Work

Future versions may support recurring Tasks.

Recurring Task generation must create normal Task instances subject to normal authorization and validation.

---

## 190. Dependencies

Future versions may support Task dependencies.

Example:

```text
Task A
    ↓
must complete before
    ↓
Task B
```

Dependency logic is not required for the first implementation.

---

## 191. Subtasks

Future versions may support subtasks.

The initial implementation should avoid unnecessary hierarchy complexity.

---

## 192. Task Relationships

Future versions may support:

```text
related task
blocked by
blocks
duplicate of
```

These are not required for the first implementation.

---

## 193. Comments

Comments may be introduced after the core Task lifecycle works.

The first implementation should prioritize:

```text
Task
Assignment
Progress
Status
History
```

---

## 194. Attachments

Attachments should not block initial Task implementation.

---

## 195. Notifications

Notifications should not block initial Task implementation.

---

## 196. Reporting

Reporting should not block initial Task implementation.

---

## 197. Analytics

Analytics should not block initial Task implementation.

---

## 198. Project Integration

Project integration should remain optional until the Project module is implemented.

---

## 199. Department Integration

Department integration should use the Core organizational models.

---

## 200. Team Integration

Team integration should use the appropriate organizational model.

---

## 201. Identity Integration

WORK must use Core Identity rather than maintaining its own user system.

---

## 202. Membership Integration

WORK must use Core Membership to establish organizational participation.

---

## 203. Role Integration

WORK must use Core Role definitions.

---

## 204. Permission Integration

WORK must use Core Permission definitions.

---

## 205. Policy Integration

WORK must use Core Policy evaluation for contextual authorization.

---

## 206. Session Integration

WORK requests must originate from a valid authenticated Session.

---

## 207. Authentication Integration

WORK must not implement independent authentication.

---

## 208. Work Entry

The initial navigation should expose:

```text
WORK
├── My Work
├── Tasks
└── Create Task
```

Additional navigation can be added later.

---

## 209. My Work Dashboard

The initial dashboard should prioritize:

```text
My Active Tasks
Overdue
Blocked
Due Soon
Recently Completed
```

---

## 210. Task Creation UI

The initial Create Task form should contain only fields necessary for the first working workflow.

Suggested fields:

```text
Title
Description
Assignee
Priority
Due Date
Department
Team
Project
```

Optional fields may be hidden unless applicable.

---

## 211. Task Detail UI

Task detail should clearly display:

```text
Status
Progress
Assignee
Owner
Due Date
Priority
Description
History
```

---

## 212. Task Actions

Available actions should be dynamically determined by authorization.

Examples:

```text
Edit
Assign
Reassign
Start
Update Progress
Block
Resume
Complete
Cancel
Archive
```

The UI must not be the final authorization boundary.

---

## 213. Progress UI

The initial progress control may use:

```text
0–100%
```

with optional progress comment.

---

## 214. Status UI

Status should be visually obvious.

The UI should not require users to infer lifecycle state from other fields.

---

## 215. Overdue UI

Overdue Tasks should be identifiable without relying solely on color.

---

## 216. Assignment UI

The assignment interface should show only eligible Assignees.

Server-side validation remains mandatory.

---

## 217. Work Navigation

The Work module should remain focused.

The first version should not become a generic all-in-one dashboard.

---

## 218. MVP Definition

The minimum viable WORK module consists of:

```text
Authentication integration
Organization context
Task creation
Task listing
Task detail
Task assignment
Task reassignment
Task status
Task progress
Task completion
Task history
Authorization
```

---

## 219. MVP Flow

The MVP must support:

```text
User Login
    ↓
Open WORK
    ↓
Create Task
    ↓
Assign Member
    ↓
Member sees My Work
    ↓
Member starts Task
    ↓
Member updates Progress
    ↓
Member completes Task
    ↓
Manager sees completed Work
```

---

## 220. MVP Success Condition

The first working implementation is successful when two authorized actors can demonstrate:

```text
Actor A
    ↓
Create Task
    ↓
Assign Task to Actor B

Actor B
    ↓
See Task
    ↓
Update Progress
    ↓
Complete Task

Actor A
    ↓
See updated state
```

while unauthorized actors cannot access or mutate the Task outside their permitted scope.

---

## 221. MVP Non-Goals

The first implementation does not need:

```text
advanced analytics
complex workflow engine
recurring tasks
task dependencies
subtasks
advanced reporting
file management
advanced notifications
external integrations
```

These may be introduced later.

---

## 222. First Implementation Priority

Implementation order should be:

```text
1. Task model
2. Assignment model
3. Task status
4. Task progress
5. Task history
6. Authorization integration
7. Task APIs
8. My Work
9. Task detail
10. Task actions
```

---

## 223. First Database Priority

Initial persistence should support:

```text
tasks
task_assignments
task_progress
task_history
```

Additional data models should be introduced only when required.

---

## 224. First API Priority

Initial APIs:

```text
POST   /work/tasks
GET    /work/tasks
GET    /work/tasks/{id}
PATCH  /work/tasks/{id}
POST   /work/tasks/{id}/assign
POST   /work/tasks/{id}/reassign
POST   /work/tasks/{id}/progress
POST   /work/tasks/{id}/complete
POST   /work/tasks/{id}/cancel
```

---

## 225. First UI Priority

Initial UI:

```text
Login
    ↓
WORK
    ↓
My Work
    ↓
Task List
    ↓
Task Detail
    ↓
Create / Assign / Progress / Complete
```

---

## 226. Authorization Priority

Every operation must integrate with:

```text
Identity
Membership
Role
Permission
Policy
```

before being considered production-ready.

---

## 227. Work Domain Contract

The WORK module must guarantee:

1. Every active Task has an Organization context.
2. Every Task has a stable identifier.
3. Every Task has a lifecycle state.
4. Every active Assignment references a valid Identity.
5. Assignment changes are controlled.
6. Progress values remain valid.
7. State transitions are explicit.
8. Authorization is server-side.
9. Organization isolation is enforced.
10. Historical changes remain attributable.
11. Concurrent updates are handled safely.
12. Unauthorized users cannot access protected Tasks.
13. Unauthorized users cannot mutate protected Tasks.
14. Task lifecycle is independent from UI implementation.
15. Core Access Control remains authoritative.

---

## 228. Work Module Architecture

Conceptually:

```text
SAOVN-OS
│
├── CORE
│   ├── Identity
│   ├── Account
│   ├── Authentication
│   ├── Session
│   ├── Organization
│   ├── Department
│   ├── Membership
│   └── Access Control
│       ├── Role
│       ├── Permission
│       └── Policy
│
└── BUSINESS
    │
    └── WORK
        ├── Task
        ├── Assignment
        ├── Progress
        ├── Status
        └── History
```

---

## 229. Work Authorization Architecture

```text
User Request
    ↓
Authentication
    ↓
Session
    ↓
Identity
    ↓
Membership
    ↓
Permission
    ↓
Policy
    ↓
WORK
    ↓
Task Operation
```

---

## 230. Work Execution Architecture

```text
Task
    ↓
Assignment
    ↓
Execution
    ↓
Progress
    ↓
State Transition
    ↓
History
    ↓
Completion
```

---

## 231. Work and Organization

The core organizational model provides the boundary.

WORK provides the operational layer.

Therefore:

```text
Organization
    =
where work belongs

WORK
    =
what work is being performed
```

---

## 232. Work and Access Control

Access Control answers:

```text
May this actor perform this action?
```

WORK answers:

```text
What happens when the action is performed?
```

---

## 233. Work and Identity

Identity identifies the actor.

WORK records the actor's relationship to Tasks.

---

## 234. Work and Membership

Membership determines organizational participation.

WORK uses Membership to validate organizational context.

---

## 235. Work and Role

Role provides authorization grouping.

WORK does not define Roles.

---

## 236. Work and Permission

Permission identifies the action capability.

WORK declares which Permissions its operations require.

---

## 237. Work and Policy

Policy determines contextual eligibility.

WORK supplies the resource and action context.

---

## 238. Work and Audit

WORK produces events and important state changes.

Audit preserves the required historical record.

---

## 239. Work and Notification

WORK emits events.

Notification determines how users are informed.

---

## 240. Work and Reporting

WORK provides authoritative operational data.

Reporting derives summaries from it.

---

## 241. Work and Project

Project provides broader project context.

Task may optionally belong to a Project.

---

## 242. Work and Department

Department provides organizational grouping.

Task may optionally belong to a Department.

---

## 243. Work and Team

Team provides operational grouping.

Task may optionally belong to a Team.

---

## 244. Work and Future Modules

Future modules may consume Work data.

Examples:

```text
Project Management
Approvals
Reporting
Analytics
Notifications
Performance
```

---

## 245. Extensibility

The Task model should be extensible without breaking:

```text
Identity
Authorization
Organization
History
```

---

## 246. Avoid Premature Complexity

The first implementation must prioritize the real workflow over theoretical completeness.

The core goal is:

```text
Create
→ Assign
→ Work
→ Track
→ Complete
```

---

## 247. First Technical Milestone

The first technical milestone is:

```text
A working Task can be created,
assigned,
viewed,
updated,
tracked,
and completed.
```

---

## 248. First Demonstration

The first demonstration should show:

```text
Login
    ↓
WORK
    ↓
Create Task
    ↓
Assign Task
    ↓
Second User Login
    ↓
My Work
    ↓
Update Progress
    ↓
Complete
    ↓
First User sees completion
```

---

## 249. Completion Criteria

WORK MVP is complete when:

```text
[ ] Authentication works
[ ] Organization context works
[ ] Task creation works
[ ] Task listing works
[ ] Task detail works
[ ] Assignment works
[ ] Reassignment works
[ ] Progress works
[ ] Status transitions work
[ ] Completion works
[ ] History works
[ ] Authorization works
[ ] Organization isolation works
```

---

## 250. Final Architectural Statement

WORK is the operational engine of SAOVN-OS.

Its central purpose is to turn organizational authority into measurable execution:

```text
Authority
    ↓
Assignment
    ↓
Responsibility
    ↓
Execution
    ↓
Progress
    ↓
Completion
```

The first practical expression of SAOVN-OS is therefore:

```text
LOGIN
    ↓
WORK
    ↓
TASK
    ↓
ASSIGN
    ↓
EXECUTE
    ↓
TRACK
    ↓
COMPLETE
```

The WORK module must remain simple enough to implement quickly, but structured enough to become the foundation for future Project, Workflow, Approval, Reporting, and organizational execution capabilities.

---

**End of Work Module Specification**
