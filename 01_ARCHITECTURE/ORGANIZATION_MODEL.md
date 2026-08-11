# SAOVN-OS — Organization Model

**Status:** Draft  
**Layer:** Core Foundation  
**Owner:** Core  
**Depends On:** Identity Model, Authentication Model, Session Model, Permission Model  
**Consumed By:** Organization, Work, Projects, Tasks, Workflow, Approvals, Audit

---

## 1. Purpose

Organization Model defines how SAOVN-OS represents an organizational boundary and how Identities participate in that organization.

Organization is a Core concept.

Membership establishes the relationship between an Identity and an Organization.

Business modules must operate within the appropriate organizational context and must not independently redefine organizational ownership.

---

## 2. Core Principle

SAOVN-OS separates:

```text
Identity
    = who the actor is

Organization
    = where the actor operates

Membership
    = the actor's relationship with that Organization

Role / Permission
    = what the actor may do
```

These concepts must remain separate.

---

## 3. Organization

An Organization represents a top-level operational boundary within SAOVN-OS.

An Organization may contain:

- members
- teams
- projects
- tasks
- workflows
- approvals
- other organizational resources

The exact resource hierarchy is defined by the relevant modules.

---

## 4. Organization Boundary

Organization is a security and data boundary.

Resources belonging to one Organization must not automatically become accessible to another Organization.

Conceptually:

```text
Organization A
    │
    ├── Members
    ├── Projects
    ├── Tasks
    └── Other Resources

Organization B
    │
    ├── Members
    ├── Projects
    ├── Tasks
    └── Other Resources
```

The existence of a Membership in Organization A does not imply access to Organization B.

---

## 5. Identity and Organization

An Identity does not automatically belong to every Organization.

Participation is established through Membership.

```text
Identity
    ↓
Membership
    ↓
Organization
```

An Identity may have multiple Memberships.

---

## 6. Membership

Membership represents the relationship between an Identity and an Organization.

Conceptually:

```text
Identity A
    ↓
Membership
    ↓
Organization X
```

Membership is the organizational context through which the Identity participates in the Organization.

---

## 7. Membership as a First-Class Concept

Membership must be treated as a first-class Core concept.

It must not be reduced to:

```text
organization_id + user_id
```

without its own lifecycle and authorization meaning.

Membership may contain or resolve:

- identity
- organization
- status
- role assignments
- scope
- membership metadata
- lifecycle information

---

## 8. Membership Lifecycle

Membership should have an explicit lifecycle.

Conceptually:

```text
Membership
├── invited
├── active
├── suspended
├── removed
└── archived
```

The exact state model may be refined during implementation.

Only an appropriate Membership state should permit organizational access.

---

## 9. Invitation

An Identity may be invited to join an Organization.

Conceptually:

```text
Organization
    ↓
Invitation
    ↓
Identity
    ↓
Membership
```

Invitation and Membership are separate concepts.

An invitation does not automatically grant organizational access.

---

## 10. Membership Activation

Membership becomes active only after the required organizational admission process is completed.

Possible flows include:

```text
Invitation
    ↓
Acceptance
    ↓
Membership Activation
```

or:

```text
Administrator
    ↓
Direct Membership Creation
    ↓
Active Membership
```

The exact workflow is deployment-dependent.

---

## 11. Membership Removal

Removing a Membership terminates the Identity's organizational participation.

Conceptually:

```text
Active Membership
    ↓
Removal
    ↓
No Organizational Access
```

Historical business records must remain attributable to the Identity where required.

Removing Membership must not delete the Identity.

---

## 12. Membership Suspension

A Membership may be suspended without deleting the relationship.

Conceptually:

```text
Active Membership
    ↓
Suspension
    ↓
Suspended Membership
```

A suspended Membership must not grant normal organizational access unless explicitly permitted by policy.

---

## 13. Multiple Organizations

An Identity may participate in multiple Organizations.

Example:

```text
Identity A
├── Membership → Organization X
├── Membership → Organization Y
└── Membership → Organization Z
```

Each Membership is independently evaluated.

Permissions granted in one Organization must not automatically transfer to another Organization.

---

## 14. Active Organization Context

An authenticated Session may operate within an active Organization context.

Conceptually:

```text
Session
    ↓
Identity
    ↓
Membership
    ↓
Active Organization
```

The active Organization must be explicit when an operation requires organizational context.

---

## 15. Organization Switching

An Identity with multiple active Memberships may switch Organization context.

Conceptually:

```text
Organization X
    ↓
Switch
    ↓
Organization Y
```

Switching context must resolve the corresponding Membership.

The new Organization context must trigger fresh authorization evaluation.

---

## 16. Organization Context Is Not Permission

Selecting an Organization does not grant permission within that Organization.

The distinction is:

```text
Organization Context
    = where the operation occurs

Permission
    = whether the operation is allowed
```

Both are required.

---

## 17. Organization and Permission

Permission evaluation must include the applicable organizational context.

Conceptually:

```text
Identity
    +
Membership
    +
Organization
    +
Role / Permission
    +
Resource
    +
Action
    ↓
Authorization Decision
```

This follows the Permission Model.

---

## 18. Organization Ownership

Resources may be owned by an Organization.

For example:

```text
Organization
    ↓
Project
    ↓
Task
```

The relevant business module defines the exact ownership relationship.

The Organization Model establishes the organizational boundary.

---

## 19. Organization Resources

Organization-owned resources must resolve to the correct Organization context.

Examples include:

```text
Project
Task
Workflow
Approval
Calendar Event
Meeting
```

The exact ownership model is defined by each module.

---

## 20. Cross-Organization Access

Cross-Organization access must never be implicit.

If an operation requires access to resources from multiple Organizations, that behavior must be explicitly modeled and authorized.

Conceptually:

```text
Organization A Resource
        +
Organization B Resource
        ↓
Explicit Cross-Organization Policy
```

Without such policy, access must be denied.

---

## 21. Organization Isolation

The default organizational security posture is isolation.

Conceptually:

```text
Organization A
    X
Organization B
```

A Membership in Organization A does not grant access to Organization B.

This applies even when the same Identity belongs to both Organizations.

---

## 22. Roles

Roles may be assigned within an Organization through Membership.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Role
    ↓
Permission
```

Role semantics are defined by the Permission Model.

Organization Model only establishes the organizational relationship.

---

## 23. Membership and Role Separation

Membership and Role are not interchangeable.

```text
Membership
    = participation

Role
    = authorization grouping
```

An Identity may remain a Member even if Role assignments change.

---

## 24. Membership and Permission Separation

Membership alone must not be interpreted as unrestricted permission.

For example:

```text
Active Membership
    ≠
Full Access
```

Permission must still be evaluated.

---

## 25. Organization Administrator

An Organization may have administrative roles.

An Organization Administrator is an authorization concept rather than a special kind of Identity.

Conceptually:

```text
Identity
    ↓
Membership
    ↓
Administrator Role
    ↓
Administrative Permissions
```

The exact permissions are defined by the Permission Model.

---

## 26. Organization Creation

Organization creation is a controlled operation.

The architecture does not require every authenticated Identity to be able to create Organizations.

Permission to create an Organization must be explicitly granted by the relevant system policy.

---

## 27. Organization Lifecycle

Organizations should have an explicit lifecycle.

Conceptually:

```text
Organization
├── active
├── suspended
├── archived
└── deleted
```

The exact lifecycle and deletion semantics must be defined during implementation.

---

## 28. Organization Suspension

A suspended Organization may temporarily restrict normal operations.

Conceptually:

```text
Active Organization
    ↓
Suspended
    ↓
Restricted Operations
```

The exact behavior is policy-dependent.

Historical records should remain available where required.

---

## 29. Organization Archival

An archived Organization is no longer an active operational context.

Archival should preserve historical information required for:

- audit
- reporting
- accountability
- historical references

Archived resources must not automatically become deleted records.

---

## 30. Organization Deletion

Deletion is a high-impact operation.

The architecture must not assume that deleting an Organization means physically deleting all related historical records.

Deletion behavior must be explicitly defined by retention and compliance requirements.

---

## 31. Membership and Historical Records

Removing or suspending a Membership must not erase historical actor references.

Example:

```text
Identity A
    ↓
created Task 123
    ↓
Membership later removed
```

Task 123 must remain attributable to Identity A.

Historical attribution is separate from current organizational access.

---

## 32. Membership and Existing Sessions

If a Membership is removed while an Identity has an active Session:

```text
Active Session
    +
Membership Removed
    ↓
No Access to Organization
```

The Session may remain valid for other Organizations depending on the Identity's other active Memberships.

Authorization must evaluate current Membership state.

---

## 33. Membership and Authentication

Authentication establishes the Identity.

Membership establishes organizational participation.

Therefore:

```text
Authentication
    ↓
Identity
    ↓
Membership
    ↓
Organization
```

Authentication alone must not grant organizational access.

---

## 34. Membership and Session

Session provides the authenticated runtime context.

Membership provides the organizational relationship.

Therefore:

```text
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization Context
```

The Session does not permanently authorize the Identity for an Organization.

---

## 35. Organization and Work

The Work Platform operates within Organizations.

Conceptually:

```text
Organization
    ↓
Work
    ├── Projects
    ├── Tasks
    ├── Workflow
    ├── Approvals
    ├── Calendar
    └── Meetings
```

The Work module must resolve the appropriate Organization context before performing organizational operations.

---

## 36. Task Assignment Example

A future Task operation may look like:

```text
Organization
    ↓
Project
    ↓
Task
    ↓
Assignment
```

Suppose:

```text
Actor
    = Identity A

Assignee
    = Identity B
```

Both identities may need valid Memberships in the relevant Organization.

The Permission Model determines whether Identity A may assign the Task to Identity B.

---

## 37. Team Boundary

Organizations may contain Teams.

Team is a business or organizational structure that belongs to the Organization Model or a dedicated organizational module, depending on the final module architecture.

Conceptually:

```text
Organization
    ↓
Team
    ├── Member A
    ├── Member B
    └── Member C
```

Team membership must not replace Organization Membership.

A Team Member is still an Organization Member.

---

## 38. Team and Organization Membership

The relationship should conceptually remain:

```text
Identity
    ↓
Organization Membership
    ↓
Team Membership
```

Team participation must not exist outside an Organization context.

---

## 39. Organization Boundary for Teams

A Team must belong to one Organization unless an explicit cross-organization architecture is introduced.

Therefore:

```text
Organization A
    └── Team A

Organization B
    └── Team B
```

Team A must not implicitly contain members through Organization B.

---

## 40. Organization Context in APIs

APIs operating on organization-owned resources must resolve the Organization context from trusted authentication and resource relationships.

The client must not be able to bypass authorization simply by changing:

```text
organization_id
```

in a request.

The server must validate that:

```text
Identity
    ↓
Membership
    ↓
Organization
```

is valid for the requested operation.

---

## 41. Organization Context in Data

Organization ownership should be represented explicitly where required by the Data Model.

For organization-owned resources:

```text
Resource
    ↓
Organization
```

The implementation must ensure that organization relationships cannot be silently bypassed.

---

## 42. Organization Boundary in Queries

Queries against organization-owned resources must respect the active authorization context.

Conceptually:

```text
Query
    ↓
Organization Scope
    ↓
Authorized Resources
```

The application must not retrieve unrestricted organization data and rely solely on frontend filtering.

---

## 43. Organization Boundary in Commands

Commands that create or modify resources must validate the applicable Organization context before execution.

Conceptually:

```text
Command
    ↓
Organization Context
    ↓
Permission
    ↓
Business Operation
```

---

## 44. Organization Boundary in Events

Events involving organization-owned resources should preserve enough context to determine the relevant Organization.

Example:

```text
TaskCreated
    ├── Task
    ├── Organization
    └── Actor
```

The exact event contract is defined by the Integration and Application Architecture.

---

## 45. Audit

Organization-related security events should be auditable.

Examples:

```text
Organization Created
Organization Suspended
Organization Archived
Member Invited
Member Activated
Member Suspended
Member Removed
Role Changed
Organization Context Changed
```

Audit records should preserve the relevant actor and organization context.

---

## 46. Security Principle

Organization boundaries must fail closed.

If the system cannot establish that an Identity has the required Membership or authorization context:

```text
Access
    ↓
Denied
```

It must not assume organizational access.

---

## 47. Prohibited Patterns

The following patterns are prohibited.

### 47.1 Global Membership Assumption

An Identity must not be treated as a member of every Organization.

### 47.2 Organization ID Trust

A client-provided Organization ID must not be trusted without server-side validation.

### 47.3 Membership as Full Permission

Membership must not automatically mean full access.

### 47.4 Cross-Organization Leakage

Resources from one Organization must not be exposed to another without explicit authorization.

### 47.5 Deleting Identity on Membership Removal

Removing a Membership must not delete the Identity.

### 47.6 Team Without Organization

A Team must not bypass the Organization boundary.

### 47.7 Frontend-Only Isolation

Organization isolation must be enforced server-side.

---

## 48. Architectural Contract

The following rules are mandatory:

1. Organization is a Core organizational boundary.
2. Membership establishes Identity participation in an Organization.
3. Identity may have multiple Memberships.
4. Memberships are independently evaluated.
5. Organization context is distinct from Permission.
6. Membership is distinct from Role.
7. Membership is distinct from Identity.
8. Authentication establishes Identity but does not grant organizational access.
9. Session provides runtime authentication context.
10. Organization boundaries must be enforced server-side.
11. Client-provided Organization identifiers must not override server authorization.
12. Cross-Organization access must be explicitly modeled and authorized.
13. Historical actor references must survive Membership removal where required.
14. Teams must operate within an Organization boundary.
15. Work resources must resolve to the appropriate Organization context.
16. Organization access must fail closed when Membership or authorization cannot be established.

---

## 49. Future Implementation

This model will later support:

```text
Core
├── Identity
├── Account
├── Authentication
├── Session
├── Organization
└── Membership

Organization Layer
├── Teams
└── Organizational Structure

Work Platform
├── Projects
├── Tasks
├── Workflow
├── Approvals
├── Calendar
└── Meetings
```

This establishes the organizational boundary required by the Work Platform.

---

## 50. Status

This document defines the architectural Organization Model.

Implementation details such as:

- organization database schema
- membership schema
- invitation workflow
- team implementation
- organization switching API
- organization lifecycle operations
- organization-scoped queries
- organization-scoped commands
- administrative interfaces

must be defined during the appropriate technical architecture and implementation phases.

---

**End of Organization Model**