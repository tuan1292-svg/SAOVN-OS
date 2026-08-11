# SAOVN-OS — Membership Model

**Status:** Draft
**Layer:** Core Foundation
**Owner:** Core
**Depends On:** Identity Model, Account Model, Authentication Model, Session Model, Organization Model, Department Model, Permission Model
**Consumed By:** Access Control, Work, Projects, Tasks, Assignments, Workflow, Approvals, Audit

---

## 1. Purpose

Membership Model defines the relationship between an Identity and an Organization in SAOVN-OS.

Membership establishes organizational participation.

It answers:

```text
Which Organization does this Identity belong to?
What is the current state of that participation?
What organizational context applies?
```

Membership is a Core Foundation concept.

---

## 2. Core Principle

SAOVN-OS separates:

```text
Identity
    = who the person is

Account
    = how the person accesses the system

Session
    = current authenticated presence

Organization
    = where the person operates

Membership
    = participation in that Organization

Department
    = organizational placement

Role / Permission
    = what the person is allowed to do
```

These concepts must remain separate.

---

## 3. Membership Definition

A Membership represents an Identity's relationship with an Organization.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Organization
```

Membership is the organizational relationship.

---

## 4. Membership Is First-Class

Membership must be treated as a first-class entity.

It must not be reduced to an implicit relationship hidden inside:

```text
Identity
+
Organization
```

Membership has its own lifecycle and authorization meaning.

---

## 5. Identity Ownership

Membership belongs conceptually to an Identity.

The Identity remains the stable actor.

Membership only describes participation in a particular Organization.

Therefore:

```text
Identity
    ≠
Membership
```

---

## 6. Organization Ownership

Every Membership belongs to exactly one Organization.

Conceptually:

```text
Membership
├── Identity
└── Organization
```

A Membership must never silently cross Organization boundaries.

---

## 7. Multiple Memberships

An Identity may have multiple Memberships.

Example:

```text
Identity A
├── Membership → Organization X
├── Membership → Organization Y
└── Membership → Organization Z
```

Each Membership is independently evaluated.

---

## 8. Membership Independence

A Membership in one Organization does not automatically affect Memberships in another Organization.

Example:

```text
Membership A
    → Organization X

Membership B
    → Organization Y
```

Suspending Membership A does not automatically suspend Membership B unless an explicit security policy requires it.

---

## 9. Membership Lifecycle

Membership should have an explicit lifecycle.

Conceptually:

```text
Membership
├── invited
├── pending
├── active
├── suspended
├── removed
└── archived
```

The exact states may be refined during implementation.

---

## 10. Invited Membership

An invited Membership represents an Organization's intention to add an Identity.

Conceptually:

```text
Organization
    ↓
Invitation
    ↓
Identity
    ↓
Invited Membership
```

An invitation does not automatically grant normal organizational access.

---

## 11. Pending Membership

A Membership may enter a pending state while required activation or approval steps are incomplete.

Conceptually:

```text
Invited
    ↓
Pending
    ↓
Active
```

Pending Membership must not automatically receive full organizational access.

---

## 12. Active Membership

An active Membership represents valid organizational participation.

Conceptually:

```text
Identity
    ↓
Active Membership
    ↓
Organization
```

Active Membership is the normal foundation for organizational access.

---

## 13. Suspended Membership

A Membership may be suspended without destroying the historical relationship.

Conceptually:

```text
Active Membership
    ↓
Suspended
```

A suspended Membership should not provide normal organizational access unless explicitly allowed by policy.

---

## 14. Removed Membership

A removed Membership represents terminated organizational participation.

Conceptually:

```text
Active Membership
    ↓
Removed
```

A removed Membership must not grant new organizational access.

Historical records associated with the Identity must remain attributable where required.

---

## 15. Archived Membership

Membership history may be archived for long-term organizational records.

Archiving does not mean that the Identity or Organization is deleted.

Historical relationships may need to remain available for:

* audit
* reporting
* accountability
* legal retention
* historical attribution

---

## 16. Membership Activation

Activation is the transition into valid organizational participation.

Possible flow:

```text
Invitation
    ↓
Acceptance
    ↓
Activation
    ↓
Active Membership
```

Another valid flow may be:

```text
Administrator
    ↓
Membership Creation
    ↓
Active Membership
```

The exact workflow is policy-dependent.

---

## 17. Membership Deactivation

Membership may be deactivated by authorized organizational action.

Deactivation must affect current access without destroying historical identity information.

---

## 18. Membership Status and Permission

Membership status is an input to authorization.

Conceptually:

```text
Identity
    +
Membership Status
    +
Role
    +
Permission
    ↓
Authorization
```

An active Membership does not automatically mean unrestricted access.

---

## 19. Membership Is Not Role

Membership and Role are separate concepts.

```text
Membership
    = participation

Role
    = authorization grouping
```

An Identity may remain a Member while Roles change.

---

## 20. Membership Is Not Permission

Membership alone must not be interpreted as full permission.

For example:

```text
Active Membership
    ≠
Administrator
```

Permission remains governed by the Permission Model.

---

## 21. Membership and Department

Membership establishes Organization participation.

Department establishes organizational placement.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
Department
```

Department association must exist within the Organization represented by the Membership.

---

## 22. Primary Department

A Membership may have a primary Department when organizational rules require it.

Conceptually:

```text
Membership
    ↓
Primary Department
```

The primary Department is organizational context.

It is not itself a permission.

---

## 23. Multiple Departments

An Identity may be associated with multiple Departments within the same Organization when permitted.

Example:

```text
Membership
    ↓
Organization A
    ├── Engineering
    └── Research
```

The exact business rules are Organization-specific.

---

## 24. Department Change

An Identity may move from one Department to another.

Conceptually:

```text
Membership
    ↓
Department A
    ↓
Transfer
    ↓
Department B
```

The transfer must be authorized.

---

## 25. Membership and Role Scope

Roles may be attached to a Membership.

Conceptually:

```text
Membership
    ↓
Role
    ↓
Permission
```

Roles may optionally be scoped further by:

* Organization
* Department
* Team
* Resource
* other approved scope

The Permission Model remains authoritative.

---

## 26. Membership and Organization Scope

Membership establishes the highest organizational scope available to the Identity.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Organization Scope
```

Operations outside this Organization must not be permitted without explicit cross-Organization authorization.

---

## 27. Membership and Session

Session establishes authenticated presence.

Membership establishes organizational participation.

Therefore:

```text
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization
```

A valid Session does not automatically establish access to every Organization.

---

## 28. Membership Resolution

For an authenticated request requiring organizational context, the system should resolve the relevant Membership.

Conceptually:

```text
Request
    ↓
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization
```

If the required Membership cannot be established, the operation must fail closed.

---

## 29. Active Organization Context

If an Identity belongs to multiple Organizations, the application may establish an active Organization context.

Conceptually:

```text
Session
    ↓
Identity
    ↓
Selected Membership
    ↓
Active Organization
```

The selected Membership must be valid and active.

---

## 30. Organization Switching

Switching Organizations means switching the active Membership context.

Conceptually:

```text
Membership A
    ↓
Switch
    ↓
Membership B
```

The new Membership must be validated before organizational access is granted.

Permission must be evaluated again in the new Organization.

---

## 31. Membership and Authorization

Authorization may depend on Membership.

Conceptually:

```text
Identity
    +
Membership
    +
Role
    +
Permission
    +
Scope
    ↓
Authorization Decision
```

Membership is one input to authorization, not the authorization engine itself.

---

## 32. Membership and Work

The Work module operates within an Organization context.

Therefore:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
WORK
```

A Work operation requiring organizational access must resolve the relevant Membership.

---

## 33. Task Assignment

A future Task assignment may use Membership context.

Example:

```text
Actor
    ↓
Membership
    ↓
Organization
    ↓
Task
    ↓
Assignee
```

The actor must have the required permission.

The assignee must have an appropriate organizational relationship according to Work policy.

---

## 34. Cross-Department Assignment

Membership allows the system to establish that an Identity belongs to the Organization.

Department determines organizational placement.

Therefore an authorized actor may assign work across Departments when policy allows.

Example:

```text
Engineering Member
        ↓
Assign Task
        ↓
Marketing Member
```

The Permission Model determines whether the action is allowed.

---

## 35. Cross-Organization Assignment

Cross-Organization assignment must not be implicit.

Example:

```text
Organization A
    ↓
Task
    ↓
Organization B Member
```

This requires explicit business and authorization rules.

A Membership in Organization A does not automatically permit operations involving Organization B.

---

## 36. Membership and Project

Projects may be scoped to an Organization and may optionally reference Departments or Teams.

Membership establishes whether an Identity participates in the Organization containing the Project.

---

## 37. Membership and Workflow

Workflow actions may require active Membership.

For example:

```text
Workflow
    ↓
Approval
    ↓
Identity
    ↓
Membership
```

The Permission Model determines whether the Identity may perform the workflow action.

---

## 38. Membership and Approval

An Identity may act as an approver only if the applicable Membership, Role, Permission, and Scope permit the action.

Conceptually:

```text
Membership
    +
Role
    +
Permission
    ↓
Approval Authority
```

Membership alone is insufficient.

---

## 39. Membership and Audit

Membership lifecycle events should be auditable.

Examples:

```text
Membership Invited
Membership Accepted
Membership Activated
Membership Suspended
Membership Restored
Membership Removed
Membership Role Changed
Department Changed
```

Audit records should preserve relevant actor and organization context.

---

## 40. Historical Attribution

Membership changes must not rewrite historical actor attribution.

Example:

```text
Identity A
    ↓
Membership in Organization X
    ↓
Created Task 123
```

If Membership later ends:

```text
Task 123
    ↓
Created By Identity A
```

The historical record must remain attributable where required.

---

## 41. Membership and Account Disablement

If an Account becomes disabled:

```text
Account Disabled
    ↓
Authentication Restricted
```

Membership records may remain intact.

Account access and organizational membership are separate lifecycle concerns.

---

## 42. Membership and Identity Deactivation

If an Identity becomes inactive, organizational access must be restricted according to policy.

Existing Membership records may be retained for historical purposes.

Identity lifecycle and Membership lifecycle must remain conceptually separate.

---

## 43. Membership Revocation

Authorized administrators or system policies may revoke Membership.

Conceptually:

```text
Active Membership
    ↓
Revocation
    ↓
No Organizational Access
```

Revocation should take effect according to the system's security requirements.

---

## 44. Membership Restoration

A previously suspended or removed Membership may potentially be restored if policy permits.

Restoration must be an explicit authorized operation.

It must not silently recreate obsolete permissions without evaluating current authorization state.

---

## 45. Membership Invitation Security

Invitation mechanisms are security-sensitive.

An invitation must identify:

* target Organization
* intended Identity or account target
* invitation state
* relevant expiration or lifecycle information

Invitation secrets must be handled securely.

---

## 46. Invitation Does Not Equal Membership

An invitation is not equivalent to active organizational participation.

Conceptually:

```text
Invitation
    ≠
Active Membership
```

The Membership must only become active after the required admission process.

---

## 47. Duplicate Memberships

The system should prevent unintended duplicate active Memberships for the same Identity and Organization.

Conceptually:

```text
Identity A
    +
Organization X
    ↓
One authoritative active Membership
```

Historical Membership records may exist according to lifecycle requirements.

---

## 48. Membership Uniqueness

The technical data model should establish an appropriate uniqueness rule for active Membership relationships.

The exact database constraint is an implementation concern.

The architectural requirement is:

> One Identity must not accidentally hold multiple competing active Membership records for the same Organization.

---

## 49. Membership Security Boundary

Membership is part of the organizational security boundary.

The system must verify:

```text
Identity
    ↓
Valid Membership
    ↓
Organization
```

before allowing organization-scoped operations.

---

## 50. Fail-Closed Principle

If Membership cannot be reliably resolved:

```text
Access
    ↓
Denied
```

The system must not assume that a missing or ambiguous Membership means access is allowed.

---

## 51. Server-Side Enforcement

Membership validation must occur server-side.

The client must not be trusted to declare:

```text
organization_id
membership_id
department_id
```

as proof of authorization.

These values are only inputs.

The server must resolve and validate the authoritative relationships.

---

## 52. Membership Context in API

A request may contain organization-related identifiers.

The server must validate:

```text
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization
    ↓
Requested Resource
    ↓
Permission
```

before executing the operation.

---

## 53. Membership Context in Queries

Queries involving organization-owned data must use authorized Membership context.

Conceptually:

```text
Query
    ↓
Membership
    ↓
Organization Scope
    ↓
Permission
    ↓
Authorized Data
```

The system must not rely on frontend filtering for organizational isolation.

---

## 54. Membership Context in Commands

Commands that create or modify organizational resources must validate the applicable Membership.

Conceptually:

```text
Command
    ↓
Identity
    ↓
Membership
    ↓
Permission
    ↓
Business Operation
```

---

## 55. Membership and Data Ownership

Membership does not automatically mean ownership of every resource in the Organization.

For example:

```text
Membership
    ≠
Project Owner
```

Ownership remains defined by the relevant business module and Data Model.

---

## 56. Membership and Resource Access

An Identity may be an Organization Member but still lack access to a particular resource.

Example:

```text
Organization Member
        +
No Task Permission
        ↓
Task Access Denied
```

Authorization must remain resource-aware.

---

## 57. Membership and Team

Team participation may be established inside an Organization Membership context.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
Team
```

Team membership does not replace Organization Membership.

---

## 58. Team Membership

An Identity may participate in one or more Teams where permitted.

Team membership may provide organizational context for Work.

It does not automatically grant unrestricted Organization permissions.

---

## 59. Membership and Notifications

Organization-scoped notifications may depend on Membership state.

If Membership is removed:

```text
Removed Membership
    ↓
No New Organization Notifications
```

unless an explicit historical or administrative notification policy applies.

---

## 60. Membership and Files

Organization-owned files may be accessible based on Membership and Permission.

Membership alone does not guarantee access to every file.

Conceptually:

```text
Membership
    +
Permission
    ↓
File Access
```

---

## 61. Membership and Search

Search results must respect Membership and authorization boundaries.

A user must not discover organization data simply because a search query can match it.

Conceptually:

```text
Search
    ↓
Membership Scope
    ↓
Permission
    ↓
Visible Results
```

---

## 62. Membership and Reporting

Organization reports may use Membership context to determine accessible organizational data.

Reporting access must still respect Role, Permission, and Scope.

---

## 63. Membership and Organization Administration

Organization administration requires appropriate permission.

An active Membership does not automatically make an Identity an Organization Administrator.

Conceptually:

```text
Membership
    +
Administrator Role
    +
Permission
    ↓
Organization Administration
```

---

## 64. Membership and Department Administration

Department administration may be scoped to Membership and Department context.

For example:

```text
Membership
    ↓
Department Scope
    ↓
Department Permission
```

The exact permission is defined by the Permission Model.

---

## 65. Membership and Security Events

Security events may require Membership-based access changes.

Examples:

```text
Security Incident
    ↓
Membership Suspension
```

or:

```text
Organization Closure
    ↓
Membership Revocation
```

The exact incident workflow is outside this model.

---

## 66. Membership and Organization Suspension

If an Organization is suspended:

```text
Organization Suspended
    ↓
Membership Access Restricted
```

Membership records may remain intact for restoration or historical purposes.

---

## 67. Membership and Organization Archival

If an Organization is archived:

```text
Organization Archived
    ↓
Membership No Longer Operational
```

Historical Membership records should remain available where required.

---

## 68. Membership and Organization Deletion

Organization deletion is a high-impact operation.

Membership records may need to be retained or archived depending on:

* audit requirements
* retention policy
* legal requirements
* historical attribution

Deletion semantics must be explicitly defined.

---

## 69. Membership Data Exposure

Membership information is organizational data.

The application should expose only the Membership information appropriate to the requesting actor.

Examples of potentially restricted information include:

* internal role assignments
* administrative status
* organizational scope
* security state

---

## 70. Membership Enumeration

The system must avoid exposing unrestricted organization membership information.

An Identity should only be able to enumerate Memberships according to applicable authorization.

---

## 71. Membership Audit Integrity

Membership lifecycle events must be attributable to the actor or system process that caused the change.

For example:

```text
Membership Removed
├── Target Identity
├── Organization
├── Acting Identity
└── Timestamp
```

The exact audit schema belongs to Audit architecture.

---

## 72. Membership and Source of Truth

Membership must have one authoritative source of truth.

Other systems may cache or replicate Membership information.

However:

```text
Authoritative Membership
        ↓
Derived / Cached State
```

Derived state must not silently become the source of truth.

---

## 73. Membership Synchronization

External systems may provide organizational membership information.

Examples:

```text
HR System
SSO Provider
Directory
Identity Provider
```

Synchronization must preserve SAOVN-OS authorization boundaries.

External membership data must not automatically bypass local security policy.

---

## 74. External Identity Mapping

An external Identity may be mapped to a SAOVN-OS Identity.

Membership should reference the SAOVN-OS Identity.

Conceptually:

```text
External Identity
    ↓
SAOVN Identity
    ↓
Membership
    ↓
Organization
```

---

## 75. Provisioning

Membership may be created as part of account provisioning.

Conceptually:

```text
Organization
    ↓
Provision Account
    ↓
Identity
    ↓
Membership
    ↓
Activation
    ↓
Login
```

The provisioning workflow must be explicitly authorized.

---

## 76. Self-Registration

Public self-registration does not automatically create organizational Membership.

For the internal enterprise model:

```text
Public Register
    ↓
No automatic Organization Membership
```

Membership should be established through approved provisioning or invitation workflows.

---

## 77. Membership and Login

Login establishes authentication.

Membership establishes organizational participation.

Therefore:

```text
Login
    ↓
Authentication
    ↓
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization
```

Login alone does not determine all organizational permissions.

---

## 78. Membership and Authorization Decision

The complete authorization flow may be represented as:

```text
Request
    ↓
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization
    ↓
Role / Permission / Scope
    ↓
Resource
    ↓
Action
    ↓
Authorization Decision
```

This is the bridge from Core Foundation to Work.

---

## 79. Membership and Work Entry

When an authenticated user enters WORK:

```text
Login
    ↓
Session
    ↓
Identity
    ↓
Active Membership
    ↓
Organization Context
    ↓
WORK
```

The Work module can then resolve the user's authorized organizational context.

---

## 80. Membership and My Work

The future My Work view may use Membership to determine the user's current organizational context.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
My Work
```

Task visibility must still be controlled by Work authorization.

---

## 81. Membership and Task Creation

Creating a Task inside an Organization requires an appropriate active Membership and Permission.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
Permission
    ↓
Create Task
```

---

## 82. Membership and Task Assignment

Assigning a Task requires:

```text
Actor Membership
    +
Organization Context
    +
Permission
    +
Target / Assignee Relationship
    ↓
Assignment
```

The exact assignment rules belong to the Work module.

---

## 83. Membership and Task Visibility

Membership alone does not guarantee visibility of every Task.

Task visibility may depend on:

* Organization
* Department
* Team
* Project
* Assignment
* Role
* Permission
* Scope
* Policy

These rules belong to the Work and Access Control layers.

---

## 84. Membership and Project Visibility

Project visibility must respect the Organization boundary and applicable Permission.

A Membership provides organizational participation but does not automatically expose every Project.

---

## 85. Membership and Notifications

Task and workflow notifications may depend on active Membership.

The system should avoid sending new organization-scoped notifications after Membership removal unless explicitly required.

---

## 86. Membership and Historical Work

Historical Work must preserve actor identity even after Membership changes.

Example:

```text
Identity A
    ↓
Membership
    ↓
Created Task 123
```

Later:

```text
Membership Removed
```

Task 123 must still preserve:

```text
Created By = Identity A
```

where required.

---

## 87. Membership and Reassignment

Removing Membership may require review of active Work assignments.

The Membership Model does not automatically reassign Tasks.

The Work module must define the appropriate reassignment workflow.

---

## 88. Membership and Organization Exit

When an Identity leaves an Organization:

```text
Active Membership
    ↓
Exit
    ↓
Membership Removed
```

The Work system may need to determine what happens to:

* assigned Tasks
* owned Projects
* approvals
* workflow responsibilities
* notifications

Those behaviors belong to the relevant Work policies.

---

## 89. Membership and Organization Entry

When an Identity joins an Organization:

```text
Invitation / Provisioning
    ↓
Membership
    ↓
Department / Team
    ↓
Role
    ↓
Organization Access
```

The exact onboarding process may be implemented by the Core and Organization modules.

---

## 90. Prohibited Patterns

The following patterns are prohibited.

### 90.1 Membership as Full Permission

Active Membership must not automatically mean full access.

### 90.2 Session as Membership

A Session must not be treated as proof of organizational membership.

### 90.3 Client-Controlled Membership

Client-provided Membership IDs must not override server-side validation.

### 90.4 Cross-Organization Leakage

Membership in Organization A must not expose Organization B.

### 90.5 Duplicate Active Membership

The system must not allow accidental competing active Membership records for the same Identity and Organization.

### 90.6 Historical Rewriting

Membership changes must not rewrite historical actor attribution.

### 90.7 Membership as Ownership

Membership does not automatically mean ownership of every organizational resource.

### 90.8 Frontend-Only Enforcement

Membership boundaries must be enforced server-side.

---

## 91. Architectural Contract

The following rules are mandatory:

1. Membership is a Core Foundation concept.
2. Membership represents Identity participation in an Organization.
3. Every Membership belongs to one Identity and one Organization.
4. An Identity may have multiple Memberships.
5. Memberships are independently evaluated.
6. Membership has an explicit lifecycle.
7. Only an appropriate Membership state may establish normal organizational access.
8. Membership is distinct from Identity.
9. Membership is distinct from Account.
10. Membership is distinct from Session.
11. Membership is distinct from Department.
12. Membership is distinct from Role.
13. Membership is distinct from Permission.
14. Membership provides organizational context.
15. Organization switching requires valid Membership resolution.
16. Membership changes must not rewrite historical actor attribution.
17. Membership validation must be enforced server-side.
18. Client-provided Membership identifiers must not override authorization.
19. Cross-Organization access requires explicit authorization.
20. Membership must fail closed when organizational participation cannot be established.
21. Membership may be consumed by Work for organization-scoped operations.
22. Membership alone must not authorize every Work resource.
23. Task assignment must evaluate the applicable Membership and Permission context.
24. Membership must have an authoritative source of truth.
25. External synchronization must not bypass local authorization policy.

---

## 92. Future Implementation

This model will later support:

```text
Core Foundation
│
├── Identity
│
├── Account
│
├── Authentication
│
├── Session
│
├── Organization
│   ├── Department
│   └── Membership
│
└── Access Control
    ├── Role
    ├── Permission
    ├── Scope
    └── Policy

        ↓

WORK
├── Projects
├── Tasks
├── Assignments
├── Progress
├── Workflow
├── Approvals
└── Reports
```

Membership is the bridge between the authenticated Identity and the organizational context consumed by Access Control and WORK.

---

## 93. Status

This document defines the architectural Membership Model.

Implementation details such as:

* membership database schema
* membership lifecycle implementation
* invitation system
* membership activation workflow
* membership suspension workflow
* organization switching API
* external membership synchronization
* membership administration UI
* Work reassignment behavior
* technical authorization integration

must be defined during the appropriate technical architecture and implementation phases.

---

**End of Membership Model**
