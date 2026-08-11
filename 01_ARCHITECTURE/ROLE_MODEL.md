# SAOVN-OS — Role Model

**Status:** Draft
**Layer:** Core Foundation
**Owner:** Core
**Depends On:** Identity Model, Organization Model, Department Model, Membership Model, Permission Model
**Consumed By:** Access Control, Work, Projects, Tasks, Assignments, Workflow, Approvals, Administration, Audit

---

## 1. Purpose

Role Model defines how SAOVN-OS groups permissions into meaningful organizational roles.

A Role represents a responsibility or authorization grouping.

Role is part of Access Control.

Role does not replace:

* Identity
* Membership
* Organization
* Department
* Permission
* Policy

---

## 2. Core Principle

SAOVN-OS separates:

```text
Identity
    = who the actor is

Membership
    = where the actor belongs

Role
    = authorization grouping

Permission
    = what action is allowed

Policy
    = under which conditions the action is allowed
```

These concepts must remain separate.

---

## 3. Role Definition

A Role is a named collection of Permissions.

Conceptually:

```text
Role
    ↓
Permissions
```

Example:

```text
Project Manager
    ├── project.view
    ├── project.create
    ├── task.create
    ├── task.assign
    └── task.update
```

---

## 4. Role Is Not Identity

A Role does not represent a person.

```text
Identity
    ≠
Role
```

Many Identities may hold the same Role.

---

## 5. Role Is Not Membership

Membership establishes organizational participation.

Role establishes authorization grouping.

```text
Membership
    = participation

Role
    = authorization
```

An Identity may have an active Membership without holding an administrative Role.

---

## 6. Role Is Not Permission

A Role groups Permissions.

```text
Role
    ↓
Permission
```

Role is therefore a higher-level authorization abstraction.

---

## 7. Role Is Not Policy

Role defines which Permissions are associated with an actor.

Policy determines contextual conditions.

Conceptually:

```text
Role
    ↓
Permission
    ↓
Policy
    ↓
Authorization Decision
```

---

## 8. Role Ownership

A Role may be defined at different scopes.

Possible scopes include:

```text
System
Organization
Department
Team
Project
```

The exact scope must be explicitly defined.

---

## 9. System Role

A System Role applies across the entire SAOVN-OS installation when such a role is required.

Example:

```text
System Administrator
```

System Roles are highly privileged and must be tightly controlled.

---

## 10. Organization Role

An Organization Role applies within one Organization.

Examples:

```text
Organization Administrator
Organization Member
Project Manager
```

The Role must not automatically apply to other Organizations.

---

## 11. Department Role

A Role may be scoped to a Department.

Example:

```text
Department Manager
```

The Role applies only within the applicable Department unless explicitly configured otherwise.

---

## 12. Team Role

A Role may be associated with Team-level responsibilities.

Example:

```text
Team Lead
```

Team-level Roles must remain within the Organization boundary.

---

## 13. Project Role

A Role may be scoped to a Project.

Examples:

```text
Project Manager
Project Contributor
Project Viewer
```

Project Roles are useful for Work authorization.

---

## 14. Role Assignment

Roles are assigned to actors through an appropriate authorization relationship.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Role Assignment
    ↓
Role
    ↓
Permission
```

The exact technical relationship may be implemented through Membership or another Access Control entity.

---

## 15. Role Assignment Requires Membership

An Organization-scoped Role should not be assigned to an Identity that does not have an appropriate Membership in that Organization.

Conceptually:

```text
Identity
    ↓
Active Membership
    ↓
Role
```

Without valid organizational participation, the Role must not grant organizational access.

---

## 16. Multiple Roles

An Identity may hold multiple Roles.

Example:

```text
Identity A
├── Organization Member
├── Project Manager
└── Team Lead
```

The resulting Permissions must be evaluated according to the authorization model.

---

## 17. Role Combination

Multiple Roles may contribute Permissions.

Conceptually:

```text
Role A
    ↓
Permissions A

Role B
    ↓
Permissions B

A + B
    ↓
Effective Permission Set
```

The exact conflict and precedence rules are defined by Permission and Policy.

---

## 18. Role Removal

A Role may be removed without removing the Membership.

Conceptually:

```text
Membership
    +
Role
    ↓
Role Removed
    ↓
Membership Remains
```

This allows responsibilities to change without terminating organizational participation.

---

## 19. Role Suspension

A Role assignment may be suspended independently from Membership where required.

Conceptually:

```text
Membership
    ↓
Role Assignment
    ↓
Suspended
```

The Identity may remain an active Organization Member.

---

## 20. Role Lifecycle

Roles may have a lifecycle.

Conceptually:

```text
Role
├── draft
├── active
├── suspended
├── archived
└── deleted
```

The exact lifecycle depends on implementation requirements.

---

## 21. Role Creation

Creating a Role is an administrative operation.

Only authorized actors should be able to create Roles.

Conceptually:

```text
Administrator
    ↓
Permission
    ↓
Create Role
```

---

## 22. Role Modification

Authorized administrators may modify Role definitions.

Changes may include:

* name
* description
* scope
* attached Permissions
* status

Changes must be audited where required.

---

## 23. Role Deletion

Role deletion is a sensitive authorization operation.

Deleting a Role must not delete:

* Identities
* Memberships
* historical Work
* historical audit records

Role references may need to be retained historically.

---

## 24. Built-In Roles

SAOVN-OS may provide built-in Roles.

Examples:

```text
Organization Administrator
Manager
Member
Viewer
```

Built-in Roles should have controlled definitions.

---

## 25. Custom Roles

Organizations may define custom Roles where supported.

Examples:

```text
Customer Support Manager
Technical Lead
Operations Coordinator
```

Custom Roles must still use the same Permission architecture.

---

## 26. Role Naming

Role names are human-readable organizational labels.

Names must not be treated as security identifiers.

For example:

```text
"Manager"
```

must not be used as the authorization primitive.

Stable Role identifiers should be used internally.

---

## 27. Role Description

A Role should have a clear description explaining its intended responsibility.

Example:

```text
Project Manager
= manages project-level planning,
  task assignment,
  progress tracking,
  and project reporting
```

Descriptions are organizational documentation, not authorization rules.

---

## 28. Role Permissions

A Role may contain multiple Permissions.

Example:

```text
Role: Project Manager

Permissions:
├── project.view
├── project.update
├── task.create
├── task.update
├── task.assign
└── task.progress.view
```

Permission definitions remain authoritative.

---

## 29. Permission Addition

Adding a Permission to a Role may increase the effective authority of every actor holding that Role.

Therefore Role Permission changes are security-sensitive.

They should be auditable.

---

## 30. Permission Removal

Removing a Permission from a Role may reduce the effective authority of all Role holders.

The change should take effect according to the authorization consistency requirements.

---

## 31. Role Scope

A Role should have an explicit scope.

Examples:

```text
Organization
Department
Team
Project
```

Scope determines where the Role applies.

---

## 32. Scope Does Not Equal Permission

Scope determines where authorization applies.

Permission determines what action may be performed.

```text
Scope
    = where

Permission
    = what
```

---

## 33. Role and Department

A Department-scoped Role applies only to the applicable Department.

Example:

```text
Department Manager
    ↓
Engineering
```

The Role does not automatically grant Department Manager authority over:

```text
Marketing
Finance
Operations
```

---

## 34. Role and Team

A Team Role may apply to one Team.

Example:

```text
Team Lead
    ↓
Backend Team
```

The Role does not automatically apply to every Team.

---

## 35. Role and Project

A Project Role may apply to one Project.

Example:

```text
Project Manager
    ↓
Project Alpha
```

The Role does not automatically make the actor a Project Manager for Project Beta.

---

## 36. Role and Organization

An Organization Role applies within one Organization.

Conceptually:

```text
Organization A
    ↓
Organization Administrator
```

The same Role assignment does not automatically grant:

```text
Organization B
```

access.

---

## 37. Role and Cross-Organization Access

Cross-Organization authority must be explicitly modeled.

Holding:

```text
Organization Administrator
```

in Organization A does not automatically mean:

```text
Organization Administrator
```

in Organization B.

---

## 38. Role Inheritance

Role inheritance may be supported if required.

Example:

```text
Senior Manager
    ↓
Manager
    ↓
Member
```

However, inheritance must be explicitly defined.

It must not be inferred from Role names.

---

## 39. Role Inheritance and Permission

If Role inheritance exists:

```text
Senior Manager
    ↓
Manager
    ↓
Permissions
```

The effective Permission set must be deterministically calculable.

---

## 40. Role Conflict

An Identity may hold Roles with overlapping or conflicting authorization.

The system must define deterministic behavior.

Example:

```text
Role A
    → permission X

Role B
    → permission X
```

Duplicate grants do not create additional authority.

---

## 41. Explicit Deny

If the authorization system supports explicit Deny:

```text
Allow
    +
Deny
    ↓
Policy Evaluation
```

The precedence rules must be explicitly defined by the Policy Model.

Role alone must not invent Deny semantics.

---

## 42. Role and Policy

Policy may constrain the Permissions granted through Roles.

Example:

```text
Role
    ↓
Permission
    ↓
Policy
    ↓
Conditional Access
```

This allows authorization to depend on context.

---

## 43. Role and Time

A Role may potentially have temporal validity.

Example:

```text
Project Manager
    ↓
Valid From
    ↓
Valid Until
```

Temporal rules must be explicitly represented if implemented.

---

## 44. Role and Resource

A Role may be scoped to specific resources.

Example:

```text
Project Manager
    ↓
Project Alpha
```

Resource-level Role assignments must not escape the defined Organization boundary.

---

## 45. Role and Task

A Role may provide Permission to perform Task operations.

Examples:

```text
Task Creator
Task Assigner
Task Manager
Task Viewer
```

These are authorization concepts.

The Work module defines the actual Task lifecycle.

---

## 46. Role and Assignment

A Role may include:

```text
work.task.assign
```

Permission.

However, possessing that Permission does not necessarily mean every Task may be assigned to every Identity.

Policy and resource scope may further restrict the operation.

---

## 47. Role and Progress

A Role may include Permissions related to progress tracking.

Examples:

```text
work.task.progress.view
work.task.progress.update
```

The Work module defines the actual progress states.

---

## 48. Role and Workflow

Workflow Roles may support responsibilities such as:

```text
Workflow Owner
Approver
Reviewer
Executor
```

The actual workflow permissions remain defined by Permission and Policy.

---

## 49. Role and Approval

An approval Role may contain Permissions for approval operations.

Example:

```text
Approver
    ↓
approval.view
approval.execute
```

Policy may still determine whether the actor may approve a particular request.

---

## 50. Role and Audit

Role changes should be auditable.

Examples:

```text
Role Created
Role Updated
Role Assigned
Role Removed
Role Suspended
Role Restored
Role Permission Changed
```

Audit records should preserve relevant actor and scope.

---

## 51. Role Evaluation

Effective authorization should evaluate:

```text
Identity
    ↓
Membership
    ↓
Role Assignment
    ↓
Role
    ↓
Permission
    ↓
Scope
    ↓
Policy
    ↓
Authorization Decision
```

---

## 52. Role Resolution

For a request, the system should resolve all applicable Roles.

Conceptually:

```text
Request
    ↓
Identity
    ↓
Membership
    ↓
Applicable Role Assignments
    ↓
Roles
    ↓
Permissions
```

---

## 53. Effective Permissions

Effective Permissions are the Permissions resulting from applicable Roles and other authorization rules.

Conceptually:

```text
Roles
    ↓
Permissions
    ↓
Scope
    ↓
Policy
    ↓
Effective Permissions
```

---

## 54. Role Caching

Role information may be cached for performance.

However, cached authorization state must not remain valid beyond the defined consistency requirements.

Security-sensitive Role changes should propagate appropriately.

---

## 55. Role Revocation

When a Role is revoked:

```text
Role Assignment
    ↓
Revoked
    ↓
Permission Removed
```

The system must ensure that the revoked authority is no longer usable according to security requirements.

---

## 56. Role Assignment Expiration

A Role Assignment may expire.

Example:

```text
Project Manager
    ↓
Expires
    ↓
Role No Longer Effective
```

Expiration must be evaluated during authorization.

---

## 57. Role Delegation

Role delegation may be supported for temporary responsibilities.

Example:

```text
Manager
    ↓
Temporary Delegation
    ↓
Acting Manager
```

Delegation must be explicit, scoped, and time-bounded where appropriate.

---

## 58. Delegation Is Not Permanent Role Transfer

Delegation does not necessarily remove the original Role.

Conceptually:

```text
Original Role
    +
Temporary Delegation
```

The exact delegation semantics belong to Policy.

---

## 59. Role and Organizational Changes

When an Identity changes Department, Team, or Project:

```text
Organization Structure Change
    ↓
Role Scope Re-evaluation
```

Roles must not automatically remain valid outside their original scope.

---

## 60. Role and Membership Removal

When Membership is removed:

```text
Membership Removed
    ↓
Organization Roles No Longer Effective
```

Role assignments may be retained historically but must not grant current access.

---

## 61. Role and Membership Suspension

When Membership is suspended:

```text
Membership Suspended
    ↓
Organization Role Access Restricted
```

The Role record may remain intact for restoration.

---

## 62. Role and Account Disablement

If an Account is disabled:

```text
Account Disabled
    ↓
Authentication Restricted
```

The Role definition itself does not need to change.

Authorization must account for the current authentication state.

---

## 63. Role and Identity Deactivation

If an Identity becomes inactive, applicable Role assignments should no longer provide normal access according to policy.

Historical Role assignments may remain for audit.

---

## 64. Role and Organization Suspension

If an Organization is suspended:

```text
Organization Suspended
    ↓
Organization Roles Restricted
```

The Role definitions may remain available for restoration.

---

## 65. Role and Organization Archival

Archived Organizations should not provide normal active Role authority.

Historical Role assignments may remain available for audit.

---

## 66. Role Source of Truth

Role definitions must have one authoritative source.

Other systems may cache or replicate Role data.

However:

```text
Authoritative Role
    ↓
Derived State
```

Derived state must not silently become the source of truth.

---

## 67. External Role Synchronization

External identity providers may provide role or group information.

Example:

```text
Identity Provider
    ↓
External Group
    ↓
SAOVN Role Mapping
```

External groups must not automatically become unrestricted SAOVN Permissions.

Mappings must be explicit.

---

## 68. Role Mapping

External roles may be mapped to internal Roles.

Example:

```text
External Group:
Project-Managers

        ↓

SAOVN Role:
Project Manager
```

The mapping must be explicitly configured.

---

## 69. Role Provisioning

Roles may be assigned during provisioning.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Provisioning
    ↓
Role Assignment
```

Provisioning must follow the organization's authorization policy.

---

## 70. Default Role

An Organization may define a default Role for newly activated Memberships.

Example:

```text
New Member
    ↓
Default Role
    ↓
Organization Member
```

Default Roles must provide only the minimum required authority.

---

## 71. Least Privilege

Role design must follow the principle of least privilege.

A Role should provide only the Permissions required for its intended responsibility.

---

## 72. Role Composition

Roles should be designed around coherent responsibilities.

Avoid creating a single Role containing unrelated authority.

Prefer:

```text
Project Manager
```

over:

```text
Everything Administrator
```

unless full administrative authority is genuinely required.

---

## 73. Role Granularity

Roles should be neither excessively broad nor excessively fragmented.

The appropriate granularity depends on organizational requirements.

The Permission layer provides the finer authorization primitives.

---

## 74. Role Naming Stability

Human-readable Role names may change.

Internal Role identifiers should remain stable where possible.

Historical records should reference stable identifiers.

---

## 75. Role Description Stability

Role descriptions may evolve without changing the underlying authorization semantics.

Authorization should rely on stable identifiers and Permission relationships.

---

## 76. Role Versioning

Security-sensitive systems may require Role versioning.

Example:

```text
Project Manager v1
Project Manager v2
```

Versioning should be introduced only when required.

---

## 77. Role Change Impact

Changing a Role's Permissions may affect many actors.

Therefore:

```text
Role Change
    ↓
Potentially Many Identities
```

Such changes should be treated as security-sensitive administrative operations.

---

## 78. Role Change Audit

Role Permission changes should record:

* actor
* Role
* Permission
* previous state
* new state
* timestamp
* scope

The exact Audit schema is defined separately.

---

## 79. Role Import

Roles may be imported from approved configuration sources.

Imported Roles must pass validation before becoming active.

---

## 80. Role Export

Roles may be exported for configuration or deployment purposes where required.

Sensitive authorization configuration should be handled appropriately.

---

## 81. Role and Multi-Tenant Isolation

Organization-scoped Roles must remain isolated between Organizations.

Example:

```text
Organization A
    ↓
Project Manager

Organization B
    ↓
Project Manager
```

These are separate assignments even if they share the same Role definition name.

---

## 82. Role and Cross-Organization Identity

An Identity may hold different Roles in different Organizations.

Example:

```text
Identity A

Organization X
    → Member

Organization Y
    → Administrator
```

The Organization Y Role must not affect Organization X.

---

## 83. Role and Department Context

A Role may be scoped to Department.

Example:

```text
Engineering
    ↓
Department Manager
```

The same Identity may have a different Role in another Department.

---

## 84. Role and Team Context

A Role may be scoped to Team.

Example:

```text
Backend Team
    ↓
Team Lead
```

The Role must not automatically apply to another Team.

---

## 85. Role and Project Context

A Role may be scoped to Project.

Example:

```text
Project Alpha
    ↓
Project Manager
```

The same Identity may hold:

```text
Project Viewer
```

in Project Beta.

---

## 86. Role and Work Module

The Work module consumes Role information to determine which Work operations an actor may perform.

Conceptually:

```text
Role
    ↓
Permission
    ↓
WORK
```

Work must not redefine Core Role semantics.

---

## 87. Role and My Work

The My Work interface may use Role and Permission information to determine available actions.

For example:

```text
Task visible
    +
task.assign permission
    ↓
Assign action available
```

UI visibility is not a replacement for server-side authorization.

---

## 88. Role and Task Assignment

Task assignment should require the appropriate Permission.

A Role may provide:

```text
work.task.assign
```

but Policy may still restrict:

* which Tasks
* which Projects
* which Departments
* which assignees
* which organizational scopes

---

## 89. Role and Task Creation

A Role may provide:

```text
work.task.create
```

The Work module determines the actual Task creation process.

---

## 90. Role and Task Update

A Role may provide:

```text
work.task.update
```

Policy may determine whether the actor may update a specific Task.

---

## 91. Role and Task Completion

A Role may provide:

```text
work.task.complete
```

The Work module defines what completion means.

---

## 92. Role and Progress

A Role may provide:

```text
work.task.progress.view
work.task.progress.update
```

The Work module defines progress behavior.

---

## 93. Role and Workflow Transition

A Role may provide permission to perform a Workflow transition.

Example:

```text
Workflow
    ↓
Transition
    ↓
Permission
    ↓
Role
```

Policy may further constrain the transition.

---

## 94. Role and Approval Authority

Approval Roles may provide authorization for approval actions.

However, an Approval Role alone may not be sufficient.

Policy may require:

```text
Role
+
Resource Scope
+
Approval Threshold
```

---

## 95. Role and Administrative Actions

Administrative Roles may provide high-impact Permissions.

Examples:

```text
organization.manage
membership.manage
role.manage
permission.manage
```

Such Permissions should be tightly controlled.

---

## 96. Role Security

Role management is security-sensitive.

Unauthorized Role modification could escalate privileges.

Therefore:

```text
Role Management
    ↓
Strong Authorization
    ↓
Audit
```

---

## 97. Fail-Closed Principle

If applicable Role information cannot be reliably resolved:

```text
Authorization
    ↓
Denied
```

The system must not assume that an actor has the Role.

---

## 98. Server-Side Enforcement

Role authorization must be enforced server-side.

The client must not be trusted to declare:

```text
role
role_id
role_name
```

as proof of authorization.

---

## 99. Prohibited Patterns

The following patterns are prohibited.

### 99.1 Role Name as Permission

Role names must not be used as authorization primitives.

### 99.2 Role Without Membership

Organization-scoped Roles must not grant access without valid organizational participation.

### 99.3 Cross-Organization Role Leakage

A Role in one Organization must not automatically apply to another.

### 99.4 Client-Controlled Role

Client-provided Role identifiers must not override server-side authorization.

### 99.5 Role as Identity

A Role must not be used as an Identity representation.

### 99.6 Role as Policy

A Role must not contain hidden contextual rules that belong in Policy.

### 99.7 Unlimited Administrative Role

Broad administrative authority must be explicit and justified.

### 99.8 Frontend-Only Enforcement

Role authorization must be enforced server-side.

---

## 100. Architectural Contract

The following rules are mandatory:

1. Role is an Access Control concept.
2. Role groups Permissions.
3. Role is distinct from Identity.
4. Role is distinct from Membership.
5. Role is distinct from Permission.
6. Role is distinct from Policy.
7. Organization-scoped Roles require appropriate Membership.
8. Roles may be scoped to Organization, Department, Team, Project, or other approved scopes.
9. Cross-Organization Role authority must be explicit.
10. Multiple Roles may contribute to effective Permissions.
11. Role changes are security-sensitive.
12. Role Permission changes should be auditable.
13. Role removal does not automatically remove Membership.
14. Membership removal makes Organization Roles ineffective.
15. Account disablement must be considered during authorization.
16. Role names are not authorization primitives.
17. Client-provided Role information must not override server authorization.
18. Role evaluation must fail closed.
19. Work consumes Role and Permission information but does not redefine Role semantics.
20. Role design must follow least privilege.
21. Role management must be protected by strong authorization.
22. Role definitions must have an authoritative source of truth.

---

## 101. Future Implementation

This model will later support:

```text
Identity
    ↓
Membership
    ↓
Role Assignment
    ↓
Role
    ↓
Permission
    ↓
Scope
    ↓
Policy
    ↓
Authorization Decision
    ↓
WORK
```

Example:

```text
Project Manager
    │
    ├── project.view
    ├── project.update
    ├── task.create
    ├── task.update
    ├── task.assign
    └── task.progress.view
```

This structure allows SAOVN-OS to keep organizational participation, authorization, and business operations separate.

---

## 102. Status

This document defines the architectural Role Model.

Implementation details such as:

* Role database schema
* Role assignment schema
* Role scope implementation
* Role inheritance
* Role delegation
* external role mapping
* Role administration APIs
* Role caching
* authorization resolution

must be defined during the appropriate technical architecture and implementation phases.

---

**End of Role Model**
