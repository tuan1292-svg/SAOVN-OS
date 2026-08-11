# SAOVN-OS — Department Model

**Status:** Draft  
**Layer:** Core Foundation  
**Owner:** Core  
**Depends On:** Identity Model, Organization Model, Permission Model  
**Consumed By:** Work, Projects, Tasks, Workflow, Approvals, Reporting, Audit

---

## 1. Purpose

Department Model defines how SAOVN-OS represents organizational departments within an Organization.

A Department provides organizational structure and context.

A Department is not itself a permission.

Department membership must not automatically grant unrestricted access.

---

## 2. Core Principle

SAOVN-OS separates organizational concepts:

```text
Organization
    = organizational boundary

Department
    = organizational unit

Team
    = working group

Membership
    = Identity participation

Role / Permission
    = authorization
```

These concepts must remain separate.

---

## 3. Department

A Department represents an organizational unit within an Organization.

Conceptually:

```text
Organization
    ↓
Department
```

A Department may contain:

- members
- teams
- projects
- organizational responsibilities
- other organizational structures

The exact business ownership of resources remains defined by the relevant module.

---

## 4. Department Boundary

A Department exists inside exactly one Organization.

Conceptually:

```text
Organization A
├── Department A
├── Department B
└── Department C

Organization B
├── Department D
└── Department E
```

A Department must not implicitly cross Organization boundaries.

---

## 5. Organization Ownership

Every Department must belong to an Organization.

Conceptually:

```text
Department
    ↓
Organization
```

The Organization is the primary ownership boundary.

Deleting or removing a Department must not automatically imply deletion of the Organization.

---

## 6. Department Identity

A Department should have a stable identity within its Organization.

The exact identifier strategy is an implementation concern.

Conceptually:

```text
Department
├── id
├── organization
├── name
├── status
└── metadata
```

Additional fields may be introduced during Data and Technical Design.

---

## 7. Department Name

Department names are organizational information.

Examples may include:

```text
Engineering
Finance
Human Resources
Marketing
Operations
Sales
```

The architecture does not require a fixed global list of departments.

Each Organization may define its own organizational structure.

---

## 8. Department Code

An Organization may assign a code to a Department.

Example:

```text
ENG
FIN
HR
MKT
OPS
```

Codes are organizational identifiers and must not be treated as authorization permissions.

The exact uniqueness rules are implementation concerns.

---

## 9. Department Lifecycle

Departments should have an explicit lifecycle.

Conceptually:

```text
Department
├── active
├── suspended
├── archived
└── deleted
```

The exact lifecycle may be refined during implementation.

---

## 10. Department Creation

Department creation is an organizational operation.

Permission to create a Department must be explicitly authorized.

Conceptually:

```text
Actor
    ↓
Permission
    ↓
Create Department
    ↓
Organization
```

An authenticated Identity does not automatically have permission to create Departments.

---

## 11. Department Update

Department information may be updated by authorized actors.

Possible changes include:

- name
- code
- description
- parent department
- status
- organizational metadata

Authorization must be evaluated before modification.

---

## 12. Department Deactivation

A Department may become inactive without deleting historical references.

Conceptually:

```text
Active Department
    ↓
Inactive / Archived
```

Historical records associated with the Department should remain meaningful where required.

---

## 13. Department Deletion

Department deletion is a high-impact organizational operation.

The architecture must not assume that deleting a Department means physically deleting all resources historically associated with it.

Retention and historical-reference requirements must be considered.

---

## 14. Department Membership

An Identity may be associated with a Department through organizational membership structures.

Conceptually:

```text
Identity
    ↓
Organization Membership
    ↓
Department
```

Department association must not replace Organization Membership.

The Identity must still belong to the Organization through a valid Membership.

---

## 15. Department Membership Is Not Permission

Being associated with a Department does not automatically grant every Department permission.

For example:

```text
Department Member
    ≠
Department Administrator
```

Authorization remains governed by Role, Permission, Scope, and Policy.

---

## 16. Primary Department

An Identity may have a primary Department within an Organization if organizational rules require it.

Conceptually:

```text
Identity
    ↓
Organization Membership
    ↓
Primary Department
```

The existence of a primary Department does not necessarily prevent participation in other Departments or Teams.

---

## 17. Multiple Department Associations

An Identity may be associated with multiple organizational units where permitted.

Example:

```text
Identity A
├── Department → Engineering
└── Department → Research
```

The exact business rules for multiple Department associations are Organization-specific.

---

## 18. Department and Role

Role assignments may be scoped to a Department when required by the Permission Model.

Conceptually:

```text
Organization
    ↓
Department
    ↓
Role
    ↓
Permission
```

A Department does not itself create a Role.

The Permission Model remains authoritative.

---

## 19. Department Scope

Department may be used as an authorization scope.

Example:

```text
Permission
    +
Department Scope
    ↓
Authorization Decision
```

This allows an organization to distinguish between:

```text
Organization-wide permission
```

and:

```text
Department-scoped permission
```

---

## 20. Department Scope Is Explicit

Department scope must be explicit.

An actor associated with Department A must not automatically receive access to every Department.

Conceptually:

```text
Department A
    X
Department B
```

unless the applicable Permission and Scope explicitly allow the operation.

---

## 21. Department Hierarchy

Organizations may support hierarchical Departments.

Example:

```text
Organization
└── Technology
    ├── Engineering
    ├── Infrastructure
    └── Research
```

The hierarchy is organizational structure.

It does not automatically define authorization inheritance.

---

## 22. Parent Department

A Department may optionally have a parent Department.

Conceptually:

```text
Parent Department
    ↓
Child Department
```

The parent and child must belong to the same Organization unless an explicit architecture states otherwise.

---

## 23. Department Hierarchy and Permission

Department hierarchy must not automatically imply permission inheritance.

For example:

```text
Technology
    ↓
Engineering
```

does not automatically mean:

```text
Engineering permission
    ↓
Technology permission
```

or the reverse.

Permission inheritance must be explicitly defined by policy.

---

## 24. Department and Team

A Department may contain or organize Teams.

Conceptually:

```text
Organization
    ↓
Department
    ↓
Team
```

Team remains a distinct organizational concept.

---

## 25. Team Independence

A Team is not simply another name for a Department.

```text
Department
    = organizational unit

Team
    = working group
```

A Department may contain multiple Teams.

A Team may represent a project-oriented or cross-functional working group within the Organization.

---

## 26. Team and Department

A Team may optionally be associated with a Department.

Example:

```text
Engineering
├── Backend Team
├── Frontend Team
└── QA Team
```

The exact Team model will be specified separately if required.

---

## 27. Cross-Department Teams

An Organization may require cross-department Teams.

Example:

```text
Engineering
      \
       \
        → Product Launch Team
       /
      /
Marketing
```

Cross-department participation must not break the Organization boundary.

All participants remain Organization Members.

---

## 28. Department and Project

A Project may optionally be associated with a Department.

Conceptually:

```text
Organization
    ↓
Department
    ↓
Project
```

However, Project ownership remains a Work concern.

Department association provides organizational context and may provide authorization scope.

---

## 29. Department and Task

Tasks may inherit or reference Department context through their Project or organizational ownership.

Conceptually:

```text
Organization
    ↓
Department
    ↓
Project
    ↓
Task
```

The exact Task ownership relationship is defined by the Work Data Model.

---

## 30. Task Assignment and Department

A Task may be assigned to an Identity belonging to a Department.

Example:

```text
Task
    ↓
Assignee
    ↓
Identity
    ↓
Department
```

The Department relationship helps establish organizational context.

It does not by itself authorize the assignment.

---

## 31. Assignment Across Departments

A Task may be assigned across Departments when permitted.

Example:

```text
Engineering
    ↓
Task
    ↓
Marketing
```

The operation must pass the applicable Permission and Scope checks.

Department boundaries must not silently prevent valid cross-functional work when policy permits it.

---

## 32. Department and Workflow

Workflow may use Department context.

For example:

```text
Department
    ↓
Workflow
    ↓
Approval
```

Department-specific workflows must be explicitly configured.

Department membership alone must not automatically grant workflow approval authority.

---

## 33. Department and Approval

Approval authority may be scoped to a Department.

Conceptually:

```text
Department
    ↓
Approval Scope
    ↓
Authorized Approver
```

The Permission Model determines whether an Identity may approve a specific resource.

---

## 34. Department and Reporting

Department may be used as a reporting dimension.

Examples:

```text
Work by Department
Tasks by Department
Projects by Department
Progress by Department
```

Reporting access must still respect authorization boundaries.

A Department filter must not become a mechanism for bypassing Permission.

---

## 35. Department and Audit

Audit events may preserve Department context when relevant.

Example:

```text
TaskAssigned
├── Organization
├── Department
├── Actor
├── Task
└── Assignee
```

The exact audit schema is defined by the Audit architecture.

---

## 36. Department Context in APIs

APIs must validate Department context server-side.

A client must not be able to gain unauthorized access simply by submitting:

```text
department_id
```

The server must verify:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
Department
    ↓
Permission
```

before executing a Department-scoped operation.

---

## 37. Department Context in Data

Resources that require Department ownership or scope should explicitly represent the relevant Department relationship.

Conceptually:

```text
Resource
    ↓
Department
    ↓
Organization
```

The implementation must preserve the Organization boundary.

---

## 38. Department Queries

Queries involving Department-scoped resources must apply the appropriate authorization context.

Conceptually:

```text
Query
    ↓
Organization Scope
    ↓
Department Scope
    ↓
Permission
    ↓
Authorized Results
```

The application must not retrieve unrestricted data and rely solely on frontend filtering.

---

## 39. Department Commands

Commands that create or modify Department-scoped resources must validate the applicable Department context.

Conceptually:

```text
Command
    ↓
Organization
    ↓
Department
    ↓
Permission
    ↓
Business Operation
```

---

## 40. Department Transfer

An Identity may be transferred between Departments.

Conceptually:

```text
Department A
    ↓
Transfer
    ↓
Department B
```

The transfer must be authorized.

Historical records must not be rewritten simply because the Identity changed Departments.

---

## 41. Department Transfer and Active Work

A Department transfer does not automatically reassign existing Tasks.

For example:

```text
Identity A
    ↓
Department A
    ↓
Task 123
```

After transfer:

```text
Identity A
    ↓
Department B
```

Task 123 must retain its historical assignment unless an explicit Work operation changes it.

---

## 42. Department Transfer and Permission

After a Department transfer, Department-scoped permissions may change.

Conceptually:

```text
Old Department
    ↓
Old Scope
    ↓
Transfer
    ↓
New Department
    ↓
New Scope
```

Current authorization should be evaluated using the current organizational state according to policy.

---

## 43. Department Suspension

A Department may be suspended.

Conceptually:

```text
Active Department
    ↓
Suspended
```

Normal operations within the Department may be restricted according to policy.

Historical records remain available where required.

---

## 44. Department Archival

An archived Department is no longer an active organizational unit.

Archival should preserve historical information needed for:

- audit
- reporting
- accountability
- historical references

Archived Department records should not automatically become deleted records.

---

## 45. Department and Organization Lifecycle

Department lifecycle must respect the Organization lifecycle.

If an Organization is archived or suspended:

```text
Organization
    ↓
Department
```

Department operations may be restricted accordingly.

The Organization remains the higher-level boundary.

---

## 46. Department Isolation

Departments must not create unintended cross-Organization access.

Conceptually:

```text
Organization A
├── Department A1
└── Department A2

Organization B
├── Department B1
└── Department B2
```

Department A1 must never be treated as equivalent to Department B1 merely because names are identical.

---

## 47. Department Names Are Not Identity

Department names are not unique security identifiers.

For example:

```text
Engineering
```

may exist in multiple Organizations.

Authorization must use stable organizational relationships rather than names.

---

## 48. Department and Organization Membership

The required relationship is:

```text
Identity
    ↓
Membership
    ↓
Organization
    ↓
Department
```

A Department association must not exist outside a valid Organization context.

---

## 49. Department Security Principle

Department boundaries must fail closed.

If the system cannot establish that an Identity has the required organizational relationship and permission:

```text
Access
    ↓
Denied
```

The system must not infer access from:

- Department name
- client-provided Department ID
- job title
- Team membership alone

---

## 50. Prohibited Patterns

The following patterns are prohibited.

### 50.1 Department as Permission

A Department must not automatically grant unrestricted permissions.

### 50.2 Department Without Organization

A Department must not exist outside an Organization.

### 50.3 Client-Controlled Department Scope

A client-provided Department ID must not override server-side authorization.

### 50.4 Automatic Permission Inheritance

Department hierarchy must not automatically create authorization inheritance.

### 50.5 Identity Deletion on Department Transfer

Moving an Identity between Departments must not delete the Identity.

### 50.6 Historical Record Rewriting

Department changes must not rewrite historical organizational attribution.

### 50.7 Frontend-Only Department Isolation

Department-level access control must be enforced server-side.

---

## 51. Architectural Contract

The following rules are mandatory:

1. Department is an organizational structure inside an Organization.
2. Every Department belongs to one Organization.
3. Department does not itself represent Permission.
4. Organization Membership remains the foundation of organizational participation.
5. Department association must exist within valid Organization context.
6. Department may be used as an authorization Scope.
7. Department hierarchy does not automatically imply permission inheritance.
8. Teams are distinct from Departments.
9. Cross-department Teams may exist within an Organization.
10. Department context may be used by Work resources.
11. Task assignment may cross Departments when authorized.
12. Department changes must not rewrite historical records.
13. Department transfers must be explicitly authorized.
14. Department-scoped access must be enforced server-side.
15. Client-provided Department identifiers must not override authorization.
16. Department access must fail closed when organizational context cannot be established.

---

## 52. Future Implementation

This model will later support:

```text
Organization
│
├── Departments
│   ├── Engineering
│   ├── Finance
│   ├── Marketing
│   └── Operations
│
└── Teams
    ├── Team A
    ├── Team B
    └── Cross-functional Teams

        ↓

Work Platform
├── Projects
├── Tasks
├── Assignments
├── Workflow
├── Approvals
├── Progress
└── Reports
```

The Department Model provides organizational structure that can be consumed by the Work Platform and Access Control.

---

## 53. Status

This document defines the architectural Department Model.

Implementation details such as:

- department database schema
- department hierarchy implementation
- department membership schema
- department transfer workflow
- department-scoped APIs
- department-scoped queries
- team implementation
- administrative interfaces

must be defined during the appropriate technical architecture and implementation phases.

---

**End of Department Model**