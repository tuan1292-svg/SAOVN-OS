# SAOVN-OS — WORK API SPECIFICATION

**Status:** Draft
**Layer:** Business Module
**Module:** WORK
**Depends On:** Identity, Organization, Membership, Role, Permission, Policy
**Related Specifications:**

* `WORK_MODULE_SPECIFICATION.md`
* `WORK_DATA_MODEL.md`

---

## 1. Purpose

This document defines the API contract for the WORK module.

The API provides the operational interface for:

```text
Create Task
    ↓
View Task
    ↓
Assign Task
    ↓
Start Work
    ↓
Update Progress
    ↓
Block / Unblock
    ↓
Complete Task
    ↓
Cancel / Archive
```

The API must preserve the architectural boundaries defined by SAOVN-OS Core.

---

## 2. API Principles

The WORK API follows these principles:

1. Authentication is provided by the Core identity/session layer.
2. Authorization is evaluated before protected operations.
3. WORK owns task operations.
4. Identity data remains owned by Core.
5. API consumers must never bypass organizational scope.
6. State transitions must be explicit.
7. Mutations must be auditable.
8. Historical records must remain traceable.
9. API responses must not expose unnecessary internal data.
10. Errors must be deterministic and machine-readable.

---

## 3. API Base Path

The initial API namespace is:

```text
/api/work
```

Task resources are exposed under:

```text
/api/work/tasks
```

---

## 4. Resource Model

The primary resources are:

```text
Task
Assignment
Progress
History
```

Conceptually:

```text
/api/work/tasks
    ├── /{task_id}
    ├── /{task_id}/assignments
    ├── /{task_id}/progress
    └── /{task_id}/history
```

---

## 5. Authentication

Protected WORK endpoints require an authenticated Session.

Conceptually:

```text
Client
  ↓
Authentication
  ↓
Session
  ↓
WORK API
```

The API must not trust a client-supplied Identity ID as proof of identity.

The authenticated actor must come from the server-side Session context.

---

## 6. Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
Are you allowed to perform this operation?
```

WORK must rely on Core authorization mechanisms for permission decisions.

---

## 7. Organizational Scope

Every Task operation must execute within an authorized Organization context.

The API must not allow a client to access arbitrary Tasks by guessing a Task ID.

Conceptually:

```text
Session
 ↓
Organization Scope
 ↓
Authorization
 ↓
Task
```

---

## 8. API Content Type

Requests and responses should use:

```text
application/json
```

unless another content type is explicitly required.

---

## 9. JSON Naming

The API should use:

```text
snake_case
```

for field names.

Example:

```json
{
  "task_id": "task_123",
  "created_at": "2026-08-11T12:00:00Z"
}
```

---

## 10. Task List

### Endpoint

```http
GET /api/work/tasks
```

### Purpose

Returns Tasks visible to the authenticated actor within the authorized organizational scope.

---

## 11. Task List Parameters

Initial query parameters:

```text
organization_id
status
priority
assignee_id
owner_id
creator_id
department_id
team_id
project_id
due_before
due_after
page
page_size
```

Not every parameter is required for MVP.

---

## 12. Task List Scope

The server determines the maximum accessible scope.

A client-provided:

```text
organization_id
```

must not grant access to an Organization the actor is not authorized to access.

---

## 13. Task List Example

```http
GET /api/work/tasks?status=in_progress&page=1&page_size=20
```

---

## 14. Task List Response

Example:

```json
{
  "items": [
    {
      "id": "task_123",
      "organization_id": "org_001",
      "title": "Prepare project report",
      "description": "Prepare the weekly project report.",
      "status": "in_progress",
      "priority": "normal",
      "progress": 50,
      "creator_id": "identity_001",
      "owner_id": "identity_002",
      "due_at": "2026-08-12T17:00:00Z",
      "completed_at": null,
      "archived_at": null,
      "created_at": "2026-08-11T09:00:00Z",
      "updated_at": "2026-08-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 1
  }
}
```

---

## 15. Task Creation

### Endpoint

```http
POST /api/work/tasks
```

### Purpose

Creates a new Task.

---

## 16. Task Creation Request

Example:

```json
{
  "title": "Prepare project report",
  "description": "Prepare the weekly project report.",
  "priority": "normal",
  "owner_id": "identity_002",
  "department_id": "department_001",
  "team_id": "team_001",
  "project_id": "project_001",
  "due_at": "2026-08-12T17:00:00Z"
}
```

---

## 17. Task Creation Rules

The server must:

1. authenticate the actor
2. determine Organization scope
3. authorize Task creation
4. validate input
5. create the Task
6. create the initial History record
7. return the created Task

---

## 18. Creator Assignment

The `creator_id` must come from the authenticated actor.

The client must not be allowed to impersonate another creator by submitting:

```json
{
  "creator_id": "another_identity"
}
```

---

## 19. Initial Task State

New Tasks should default to:

```text
status   = draft
priority = normal
progress = 0
version  = 1
```

---

## 20. Task Creation Response

Recommended:

```http
201 Created
```

Example:

```json
{
  "data": {
    "id": "task_123",
    "organization_id": "org_001",
    "title": "Prepare project report",
    "description": "Prepare the weekly project report.",
    "status": "draft",
    "priority": "normal",
    "progress": 0,
    "creator_id": "identity_001",
    "owner_id": "identity_002",
    "due_at": "2026-08-12T17:00:00Z",
    "completed_at": null,
    "archived_at": null,
    "created_at": "2026-08-11T09:00:00Z",
    "updated_at": "2026-08-11T09:00:00Z",
    "version": 1
  }
}
```

---

## 21. Get Task

### Endpoint

```http
GET /api/work/tasks/{task_id}
```

### Purpose

Returns one Task within the authorized scope.

---

## 22. Get Task Rules

The server must:

```text
authenticate
    ↓
authorize
    ↓
resolve organizational scope
    ↓
load Task
    ↓
return Task
```

---

## 23. Task Not Found

If the Task does not exist within the actor's authorized scope, the API should normally return:

```http
404 Not Found
```

The API should avoid revealing whether an inaccessible Task exists elsewhere.

---

## 24. Update Task

### Endpoint

```http
PATCH /api/work/tasks/{task_id}
```

### Purpose

Updates mutable Task metadata.

---

## 25. Mutable Task Fields

Initial mutable fields:

```text
title
description
priority
owner_id
department_id
team_id
project_id
due_at
```

---

## 26. Protected Task Fields

The client must not directly modify:

```text
id
organization_id
creator_id
status
progress
completed_at
archived_at
created_at
updated_at
version
```

through the generic update endpoint.

Lifecycle changes must use explicit operations.

---

## 27. Update Task Example

```json
{
  "title": "Prepare final project report",
  "priority": "high",
  "due_at": "2026-08-13T17:00:00Z"
}
```

---

## 28. Update Response

Recommended:

```http
200 OK
```

The response returns the current authoritative Task representation.

---

## 29. Optimistic Concurrency

Task mutations should support optimistic concurrency.

A client may provide:

```text
If-Match
```

or an equivalent version value.

Example:

```text
version = 4
```

The server must reject stale mutations where the stored version has changed.

---

## 30. Stale Version

Recommended response:

```http
409 Conflict
```

Example:

```json
{
  "error": {
    "code": "TASK_VERSION_CONFLICT",
    "message": "The task has been modified by another operation."
  }
}
```

---

## 31. Assign Task

### Endpoint

```http
POST /api/work/tasks/{task_id}/assignments
```

### Purpose

Creates an Assignment for an Identity.

---

## 32. Assignment Request

Example:

```json
{
  "assignee_id": "identity_002"
}
```

---

## 33. Assignment Authorization

The server must verify that the authenticated actor has permission to assign the Task.

The API must not rely on the client interface to enforce this rule.

---

## 34. Assignee Validation

The target Identity must satisfy the applicable organizational membership rules.

Conceptually:

```text
Task Organization
        │
        ▼
Target Identity
        │
        ▼
Valid Membership
```

---

## 35. Assignment Creation

The server creates:

```text
Assignment
+
History
```

as one logical operation.

---

## 36. Assignment Response

Recommended:

```http
201 Created
```

Example:

```json
{
  "data": {
    "id": "assignment_001",
    "task_id": "task_123",
    "assignee_id": "identity_002",
    "assigned_by": "identity_001",
    "status": "active",
    "assigned_at": "2026-08-11T12:00:00Z",
    "started_at": null,
    "completed_at": null,
    "revoked_at": null,
    "created_at": "2026-08-11T12:00:00Z",
    "updated_at": "2026-08-11T12:00:00Z"
  }
}
```

---

## 37. Task State After Assignment

When the first valid Assignment is created:

```text
draft
  ↓
assigned
```

The corresponding History event is:

```text
assigned
```

---

## 38. Reassignment

Reassignment should use the same Assignment endpoint.

If an active Assignment already exists:

```text
old Assignment
    ↓
revoked
    ↓
new Assignment
    ↓
active
```

---

## 39. Reassignment History

The operation must create:

```text
event_type = reassigned
```

The History metadata may identify the old and new Assignees.

---

## 40. List Assignments

### Endpoint

```http
GET /api/work/tasks/{task_id}/assignments
```

Returns Assignment history for the Task.

---

## 41. Start Task

### Endpoint

```http
POST /api/work/tasks/{task_id}/start
```

### Purpose

Starts execution of an assigned Task.

---

## 42. Start Requirements

The server should verify:

```text
Task exists
+
Task is assigned
+
Actor is authorized
+
Actor has valid execution relationship
```

---

## 43. Start Transition

Valid initial transition:

```text
assigned
    ↓
in_progress
```

---

## 44. Start Response

Recommended:

```http
200 OK
```

Returns the updated Task.

---

## 45. Start History

The server creates:

```text
event_type = started
```

---

## 46. Progress Update

### Endpoint

```http
POST /api/work/tasks/{task_id}/progress
```

### Purpose

Records a progress update.

---

## 47. Progress Request

Example:

```json
{
  "progress": 50,
  "comment": "Initial implementation is complete."
}
```

---

## 48. Progress Validation

The API must validate:

```text
0 <= progress <= 100
```

---

## 49. Progress Authorization

Only an authorized actor may submit progress.

For MVP, this normally includes the active Assignee and authorized management actors.

---

## 50. Progress Operation

The server performs:

```text
authorize
    ↓
validate Task state
    ↓
validate progress
    ↓
update Task.progress
    ↓
create Progress Record
    ↓
create History Record
```

This must be transactionally consistent.

---

## 51. Progress Response

Recommended:

```http
201 Created
```

Example:

```json
{
  "data": {
    "id": "progress_001",
    "task_id": "task_123",
    "actor_id": "identity_002",
    "progress": 50,
    "comment": "Initial implementation is complete.",
    "created_at": "2026-08-11T14:00:00Z"
  }
}
```

---

## 52. Progress History Event

The corresponding History event:

```text
event_type = progress_updated
```

---

## 53. Completion

### Endpoint

```http
POST /api/work/tasks/{task_id}/complete
```

### Purpose

Completes the Task.

---

## 54. Completion Requirements

The server must verify:

```text
Task exists
+
Actor authorized
+
Current state permits completion
```

---

## 55. Completion Transition

Valid transition:

```text
in_progress
    ↓
completed
```

The exact allowed states may be expanded by Policy.

---

## 56. Completion Mutation

Completion updates:

```text
status = completed
progress = 100
completed_at = now
updated_at = now
version = version + 1
```

---

## 57. Completion History

The server creates:

```text
event_type = completed
```

---

## 58. Completion Response

Recommended:

```http
200 OK
```

Returns the updated Task.

---

## 59. Block Task

### Endpoint

```http
POST /api/work/tasks/{task_id}/block
```

### Purpose

Marks a Task as blocked.

---

## 60. Block Request

Optional:

```json
{
  "reason": "Waiting for required information."
}
```

---

## 61. Block Transition

```text
in_progress
    ↓
blocked
```

---

## 62. Block History

The server creates:

```text
event_type = blocked
```

The reason may be stored in event metadata.

---

## 63. Unblock Task

### Endpoint

```http
POST /api/work/tasks/{task_id}/unblock
```

### Purpose

Returns a blocked Task to active execution.

---

## 64. Unblock Transition

```text
blocked
    ↓
in_progress
```

---

## 65. Unblock History

The server creates:

```text
event_type = unblocked
```

---

## 66. Cancel Task

### Endpoint

```http
POST /api/work/tasks/{task_id}/cancel
```

### Purpose

Cancels a Task.

---

## 67. Cancel Request

Optional:

```json
{
  "reason": "The requested work is no longer required."
}
```

---

## 68. Cancel Transition

Possible states:

```text
draft
assigned
in_progress
blocked
    ↓
cancelled
```

---

## 69. Cancel History

The server creates:

```text
event_type = cancelled
```

---

## 70. Archive Task

### Endpoint

```http
POST /api/work/tasks/{task_id}/archive
```

### Purpose

Archives a completed or cancelled Task.

---

## 71. Archive Transition

Recommended:

```text
completed
    ↓
archived
```

or:

```text
cancelled
    ↓
archived
```

---

## 72. Archive Mutation

The server updates:

```text
status = archived
archived_at = now
```

---

## 73. Archive History

The server creates:

```text
event_type = archived
```

---

## 74. Task History

### Endpoint

```http
GET /api/work/tasks/{task_id}/history
```

Returns chronological lifecycle events.

---

## 75. History Response

Example:

```json
{
  "items": [
    {
      "id": "history_001",
      "task_id": "task_123",
      "actor_id": "identity_001",
      "event_type": "created",
      "old_value": null,
      "new_value": null,
      "metadata": {},
      "created_at": "2026-08-11T09:00:00Z"
    },
    {
      "id": "history_002",
      "task_id": "task_123",
      "actor_id": "identity_001",
      "event_type": "assigned",
      "old_value": null,
      "new_value": "identity_002",
      "metadata": {},
      "created_at": "2026-08-11T12:00:00Z"
    }
  ]
}
```

---

## 76. Progress History

### Endpoint

```http
GET /api/work/tasks/{task_id}/progress
```

Returns historical Progress Records.

---

## 77. Assignment History

### Endpoint

```http
GET /api/work/tasks/{task_id}/assignments
```

Returns historical Assignment records.

---

## 78. Current Task Summary

A Task detail response may include:

```text
current assignee
current progress
current status
current owner
```

These are convenience representations of authoritative underlying resources.

---

## 79. Error Model

All API errors should follow a consistent structure.

Example:

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task was not found."
  }
}
```

---

## 80. Error Fields

Recommended:

```text
code
message
details
request_id
```

`details` is optional.

---

## 81. Authentication Error

Recommended:

```http
401 Unauthorized
```

Example:

```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication is required."
  }
}
```

---

## 82. Authorization Error

Recommended:

```http
403 Forbidden
```

Example:

```json
{
  "error": {
    "code": "WORK_PERMISSION_DENIED",
    "message": "You are not authorized to perform this operation."
  }
}
```

---

## 83. Not Found Error

Recommended:

```http
404 Not Found
```

Example:

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task was not found."
  }
}
```

---

## 84. Validation Error

Recommended:

```http
400 Bad Request
```

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "progress": "Must be between 0 and 100."
    }
  }
}
```

---

## 85. Conflict Error

Recommended:

```http
409 Conflict
```

Used for:

```text
invalid concurrent update
invalid lifecycle conflict
duplicate active assignment
```

---

## 86. Unsupported Transition

Example:

```json
{
  "error": {
    "code": "INVALID_TASK_TRANSITION",
    "message": "The requested state transition is not allowed."
  }
}
```

---

## 87. Invalid Assignee

Example:

```json
{
  "error": {
    "code": "INVALID_ASSIGNEE",
    "message": "The selected Identity cannot be assigned to this Task."
  }
}
```

---

## 88. Pagination

List endpoints should support pagination.

Initial parameters:

```text
page
page_size
```

---

## 89. Page Size

The server must enforce a maximum page size.

The client must not be able to request unlimited records.

---

## 90. Default Page Size

Recommended default:

```text
20
```

---

## 91. Maximum Page Size

Recommended initial maximum:

```text
100
```

The exact value may be adjusted during implementation.

---

## 92. Sorting

Task list should support controlled sorting.

Initial fields:

```text
created_at
updated_at
due_at
priority
status
```

---

## 93. Sort Direction

Supported:

```text
asc
desc
```

The API must validate sort fields rather than directly interpolating client input into database queries.

---

## 94. Filtering

Filtering must be performed server-side.

---

## 95. Search

A future Task search endpoint may support:

```text
title
description
```

The first MVP implementation does not require full-text search.

---

## 96. Idempotency

Mutating endpoints that may be retried should support an Idempotency mechanism.

Recommended header:

```text
Idempotency-Key
```

---

## 97. Idempotent Assignment

Repeated requests with the same Idempotency-Key must not accidentally create duplicate Assignments.

---

## 98. Idempotent Completion

Repeated completion requests should not create multiple inconsistent completion operations.

---

## 99. Idempotent Progress

Progress submissions are semantically different from ordinary PUT updates.

If Idempotency-Key is used, the server must ensure that retries do not accidentally duplicate the same Progress Record.

---

## 100. Request IDs

Each API request should have a traceable request identifier.

Example header:

```text
X-Request-ID
```

The server may generate one if the client does not provide a valid identifier.

---

## 101. Audit Correlation

Mutating operations should be traceable through:

```text
request_id
actor
task_id
operation
timestamp
```

---

## 102. Rate Limiting

The API should support rate limiting.

Rate limits belong to the broader platform infrastructure and should not be hard-coded into WORK business logic.

---

## 103. API Versioning

The initial implementation may use:

```text
/api/work
```

without an explicit version.

If breaking changes become necessary, versioning may be introduced.

Example future form:

```text
/api/v2/work
```

---

## 104. Backward Compatibility

Non-breaking additions should not invalidate existing clients.

Breaking changes require an explicit API versioning strategy.

---

## 105. Transaction Requirements

The following operations must be transactional where the underlying storage supports transactions:

```text
Task Creation
Assignment
Reassignment
Progress Update
Completion
Cancellation
Archive
```

---

## 106. Task Creation Transaction

Creation consists of:

```text
Task
+
created History
```

---

## 107. Assignment Transaction

Assignment consists of:

```text
Assignment
+
Task state update
+
History
```

---

## 108. Reassignment Transaction

Reassignment consists of:

```text
old Assignment update
+
new Assignment creation
+
Task state update
+
History
```

---

## 109. Progress Transaction

Progress consists of:

```text
Task progress update
+
Progress Record
+
History
```

---

## 110. Completion Transaction

Completion consists of:

```text
Task state update
+
Progress = 100
+
completed_at
+
History
```

---

## 111. Authorization Evaluation

Protected mutation flow:

```text
Request
  ↓
Authenticate
  ↓
Resolve Actor
  ↓
Resolve Organization Scope
  ↓
Load Resource
  ↓
Evaluate Permission / Policy
  ↓
Validate State Transition
  ↓
Execute Mutation
  ↓
Write History
  ↓
Return Response
```

---

## 112. Read Authorization

Read flow:

```text
Request
  ↓
Authenticate
  ↓
Resolve Scope
  ↓
Evaluate Access
  ↓
Query Scoped Resource
  ↓
Return Response
```

---

## 113. No Client-Side Authorization

The frontend must never be considered an authorization boundary.

For example, hiding an Assign button does not replace server-side permission evaluation.

---

## 114. Organization Isolation

The server must ensure that:

```text
Actor Scope
    ∩
Requested Resource Scope
```

is valid before returning or modifying data.

---

## 115. Enumeration Protection

Unauthorized resources should not be exposed through predictable IDs.

Where appropriate, the API should return the same generic `404` behavior for resources outside the actor's scope.

---

## 116. Input Validation

The API must validate:

```text
required fields
field types
field lengths
enum values
numeric ranges
timestamps
relationships
```

---

## 117. Title Validation

`title` must:

```text
exist
not be empty
meet maximum length
```

Whitespace-only values should be rejected.

---

## 118. Description Validation

`description` may be empty or null depending on implementation.

The API should enforce a maximum size.

---

## 119. Priority Validation

Allowed values:

```text
low
normal
high
urgent
```

---

## 120. Status Validation

Clients may not directly set arbitrary Task status values through the generic PATCH endpoint.

Lifecycle endpoints control status changes.

---

## 121. Progress Validation

Allowed range:

```text
0..100
```

---

## 122. Due Date Validation

`due_at` must use a valid timestamp representation.

Business rules around past due dates belong to Policy.

---

## 123. Identity Validation

Identity references must resolve to valid Core Identity records.

---

## 124. Organization Validation

Organization references must be validated against the authenticated actor's scope.

---

## 125. Department Validation

If supplied:

```text
Department.organization_id
=
Task.organization_id
```

---

## 126. Team Validation

If supplied:

```text
Team.organization_id
=
Task.organization_id
```

---

## 127. Project Validation

If supplied:

```text
Project.organization_id
=
Task.organization_id
```

---

## 128. Response Consistency

A successful mutation should return the current authoritative representation after the transaction commits.

---

## 129. HTTP Status Summary

```text
GET collection       → 200
GET resource         → 200
POST create          → 201
PATCH update         → 200
POST action          → 200 or 201
DELETE where used    → 204
Validation error     → 400
Authentication       → 401
Authorization        → 403
Not found            → 404
Conflict             → 409
Rate limited         → 429
Server error         → 500
```

---

## 130. Endpoint Summary

Initial endpoint set:

```text
GET    /api/work/tasks
POST   /api/work/tasks
GET    /api/work/tasks/{task_id}
PATCH  /api/work/tasks/{task_id}

GET    /api/work/tasks/{task_id}/assignments
POST   /api/work/tasks/{task_id}/assignments

GET    /api/work/tasks/{task_id}/progress
POST   /api/work/tasks/{task_id}/progress

GET    /api/work/tasks/{task_id}/history

POST   /api/work/tasks/{task_id}/start
POST   /api/work/tasks/{task_id}/block
POST   /api/work/tasks/{task_id}/unblock
POST   /api/work/tasks/{task_id}/complete
POST   /api/work/tasks/{task_id}/cancel
POST   /api/work/tasks/{task_id}/archive
```

---

## 131. MVP Endpoint Priority

### Phase 1

```text
POST /tasks
GET  /tasks
GET  /tasks/{id}
PATCH /tasks/{id}
```

### Phase 2

```text
POST /tasks/{id}/assignments
GET  /tasks/{id}/assignments
```

### Phase 3

```text
POST /tasks/{id}/start
POST /tasks/{id}/progress
GET  /tasks/{id}/progress
```

### Phase 4

```text
POST /tasks/{id}/block
POST /tasks/{id}/unblock
POST /tasks/{id}/complete
POST /tasks/{id}/cancel
POST /tasks/{id}/archive
GET  /tasks/{id}/history
```

---

## 132. API Dependency Boundary

WORK API depends on Core for:

```text
Authentication
Identity
Organization
Membership
Role
Permission
Policy
Session
```

WORK must not recreate these systems.

---

## 133. API Ownership

WORK owns:

```text
Task API
Assignment API
Progress API
History API
```

---

## 134. Future API Resources

Possible future resources:

```text
/comments
/attachments
/dependencies
/subtasks
/templates
/recurrence
```

These are intentionally outside the initial MVP contract.

---

## 135. API Security Principle

Every mutation must answer:

```text
Who?
What?
Which Task?
Which Organization?
Which Permission?
Which State?
What changed?
```

before committing.

---

## 136. Operational Workflow

The complete API workflow is:

```text
POST /tasks
        ↓
POST /tasks/{id}/assignments
        ↓
POST /tasks/{id}/start
        ↓
POST /tasks/{id}/progress
        ↓
POST /tasks/{id}/progress
        ↓
POST /tasks/{id}/complete
        ↓
GET /tasks/{id}/history
```

---

## 137. Final API Principle

The WORK API is not merely a CRUD interface.

It is the controlled operational boundary through which SAOVN-OS turns:

```text
Intent
  ↓
Task
  ↓
Assignment
  ↓
Execution
  ↓
Progress
  ↓
Completion
```

into an authenticated, authorized, traceable workflow.

The API must therefore preserve:

```text
Identity
+
Organization
+
Authorization
+
State
+
History
```

at every meaningful operation.

---

**End of WORK API SPECIFICATION**
