# SAOVN-OS — Identity Model

**Status:** Draft  
**Layer:** Core Foundation  
**Owner:** Core  
**Depends On:** Permission Model, Data Model  
**Consumed By:** Authentication, Organization, Work, Audit

---

## 1. Purpose

Identity Model defines how SAOVN-OS represents a person, an account, an organization membership, and the authenticated presence of that person inside the system.

Identity is a Core concern.

Business modules must not independently define their own user or account concepts.

All modules requiring knowledge of who is acting must resolve the actor through Core Identity.

---

## 2. Core Principle

SAOVN-OS separates the following concepts:

```text
Identity
    ↓
Account
    ↓
Authentication
    ↓
Session
    ↓
Membership
    ↓
Permission
```

These concepts are related but are not interchangeable.

---

## 3. Identity

Identity represents a real system actor.

An Identity is the stable representation of a person or other supported actor across the SAOVN-OS platform.

Identity must not be tied to:

- a single organization
- a single role
- a single login method
- a single business module
- a single session

An Identity may participate in multiple organizations through Memberships.

---

## 4. Account

Account represents the platform access record associated with an Identity.

An Account is responsible for platform-level access state.

Example responsibilities:

- account identifier
- account status
- authentication configuration
- login availability
- security state
- lifecycle state

Account must not contain business-module ownership rules.

---

## 5. Identity vs Account

The distinction is intentional.

```text
Identity
    = Who the actor is

Account
    = How that actor accesses SAOVN-OS
```

A business module must reference the Identity as the actor rather than embedding authentication information.

---

## 6. Authentication

Authentication establishes that an Account is allowed to establish an authenticated session.

Authentication answers:

> "Has this account successfully authenticated?"

Authentication does not answer:

> "What is this account allowed to do?"

Authorization is handled by the Permission Model.

Therefore:

```text
Authentication
    → establishes identity

Authorization
    → evaluates permission
```

These responsibilities must remain separate.

---

## 7. Login

Login is the primary entry point into SAOVN-OS.

The login flow must conceptually follow:

```text
Login Request
    ↓
Authentication
    ↓
Account Resolution
    ↓
Identity Resolution
    ↓
Session Creation
    ↓
Authenticated Context
```

The application must not allow a business module to create an independent authentication mechanism.

---

## 8. Registration Policy

SAOVN-OS does not assume open self-registration.

Account creation is an administrative or controlled operation.

Therefore:

```text
Public Registration
    = Not a Core requirement
```

The exact provisioning workflow may be defined by the deployment or organization model.

The important architectural rule is:

> An Account must exist through a controlled provisioning process.

---

## 9. Session

A Session represents an authenticated presence of an Account.

A Session contains or resolves enough information to establish the current actor context.

Conceptually:

```text
Session
    ↓
Account
    ↓
Identity
```

Session is temporary.

Identity is persistent.

Account is persistent.

---

## 10. Authenticated Context

Every authenticated request should resolve an authenticated context.

Conceptually:

```text
AuthenticatedContext

- identity
- account
- session
- organization context
- membership context
```

The exact implementation may vary.

The architectural contract does not.

---

## 11. Organization

Organization represents a top-level operational boundary within SAOVN-OS.

An Identity does not automatically belong to every organization.

Organization participation is established through Membership.

```text
Identity
    ↓
Membership
    ↓
Organization
```

---

## 12. Membership

Membership represents the relationship between an Identity and an Organization.

Membership is the primary organizational context used by the Permission Model.

A Membership may contain or resolve:

- organization
- identity
- membership status
- organizational role assignments
- scope information

Membership must not be confused with Identity.

An Identity can have multiple Memberships.

---

## 13. Role

Role is an authorization concept.

Role assignment belongs to the organizational or scoped authorization model.

Identity itself does not inherently possess business permissions.

Instead:

```text
Identity
    ↓
Membership
    ↓
Role / Permission
```

This follows the Permission Model.

---

## 14. Multi-Organization Identity

A single Identity may participate in multiple organizations.

Example:

```text
Identity A
    ├── Membership → Organization X
    └── Membership → Organization Y
```

Permissions must be evaluated within the correct organization context.

A permission granted in Organization X must not automatically grant access to Organization Y.

---

## 15. Organization Context

An authenticated session may operate within an active organization context.

The active organization must be explicit when required by the operation.

Conceptually:

```text
Session
    ↓
Identity
    ↓
Active Membership
    ↓
Organization
```

Business operations must not silently select an organization when doing so could create an authorization ambiguity.

---

## 16. Actor Resolution

All actions performed inside the platform must be attributable to an actor.

The actor should be resolved through Core Identity.

Example:

```text
Task created
    ↓
Actor = Identity
```

The Task module must not invent its own user representation.

---

## 17. System Actors

SAOVN-OS may require non-human system actors for internal operations.

If introduced, system actors must remain distinguishable from human identities.

Examples may include:

```text
System
Automation
Integration
Service
```

Their authorization rules must be explicit.

They must not bypass the Permission Model implicitly.

---

## 18. Lifecycle

Identity lifecycle and Account lifecycle are separate concerns.

Conceptually:

```text
Identity
    ├── active
    ├── suspended
    └── archived

Account
    ├── active
    ├── locked
    ├── disabled
    └── archived
```

Exact lifecycle states may be expanded during implementation.

A disabled Account does not necessarily mean the Identity ceases to exist.

---

## 19. Deactivation

Deactivation must preserve historical references where required.

Business records such as:

- Tasks
- Projects
- Comments
- Approvals
- Audit Events

must not lose their historical actor reference merely because an Account becomes inactive.

Therefore historical actor references must be designed independently from current login availability.

---

## 20. Security Boundary

Identity is a security boundary.

The system must never trust an actor identifier supplied directly by a client when an authenticated context is available.

Conceptually:

```text
Client Input
    ↓
Authenticated Context
    ↓
Resolved Identity
    ↓
Authorization
    ↓
Business Operation
```

Not:

```text
Client Input
    ↓
"user_id"
    ↓
Business Operation
```

---

## 21. Permission Boundary

Identity answers:

> Who is acting?

Permission answers:

> What may that actor do?

Business modules answer:

> What is being acted upon?

Therefore:

```text
Identity
    +
Permission
    +
Resource
    +
Action
    ↓
Authorization Decision
```

This must remain consistent with `PERMISSION_MODEL.md`.

---

## 22. Audit Boundary

Security-sensitive and business-significant operations should be attributable to an Identity or explicitly defined system actor.

Audit records should resolve:

```text
Actor
Action
Resource
Timestamp
Context
Result
```

Identity therefore acts as the foundation for platform accountability.

---

## 23. Module Boundary

Core Identity owns:

- Identity
- Account
- Authentication context
- Session
- Membership relationship

Other modules may reference Identity but must not redefine it.

Example:

```text
WORK
    → references Identity

PROJECT
    → references Identity

TASK
    → references Identity

APPROVAL
    → references Identity

AUDIT
    → references Identity
```

---

## 24. Prohibited Patterns

The following patterns are prohibited.

### 24.1 Module-specific users

```text
TaskUser
ProjectUser
ApprovalUser
```

Modules must reference Core Identity instead.

### 24.2 Business permissions inside Account

Account must not directly encode business authorization rules.

### 24.3 Authentication inside business modules

Business modules must not implement independent login systems.

### 24.4 Trusting client-provided actor identity

The server must resolve the acting Identity from authenticated context.

### 24.5 Organization leakage

A Membership or permission in one Organization must not implicitly grant access to another Organization.

---

## 25. Relationship Summary

```text
                    ┌──────────────┐
                    │   Identity   │
                    └──────┬───────┘
                           │
                           │ owns / resolves
                           ▼
                    ┌──────────────┐
                    │   Account    │
                    └──────┬───────┘
                           │
                           │ authenticates
                           ▼
                    ┌──────────────┐
                    │   Session    │
                    └──────┬───────┘
                           │
                           │ establishes
                           ▼
                    ┌──────────────┐
                    │   Context    │
                    └──────┬───────┘
                           │
                           │ selects
                           ▼
                    ┌──────────────┐
                    │ Membership   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Organization │
                    └──────────────┘


Identity + Membership
          │
          ▼
     Authorization
          │
          ▼
   Business Modules
```

---

## 26. Architectural Contract

The following rules are mandatory:

1. Identity is a Core concept.
2. Account is distinct from Identity.
3. Authentication is distinct from Authorization.
4. Session is temporary.
5. Membership establishes organizational participation.
6. Permission is evaluated through the Permission Model.
7. Business modules reference Core Identity.
8. Client-provided actor identity must not be trusted.
9. Organization boundaries must be enforced.
10. Historical actor references must remain meaningful after deactivation.
11. Authentication mechanisms must not be duplicated across modules.
12. Account provisioning is controlled rather than open self-registration.

---

## 27. Future Implementation

This model will later support:

```text
Core
├── Identity
├── Account
├── Authentication
├── Session
├── Organization
└── Membership

        ↓

Work Platform
├── Projects
├── Tasks
├── Workflow
├── Approvals
├── Calendar
└── Meetings
```

The Identity Model is therefore a Core dependency of the Work Platform.

---

## 28. Status

This document defines the architectural model.

Implementation details such as:

- database schema
- API contracts
- authentication provider
- password handling
- session storage
- token strategy
- frontend authentication state

are implementation concerns and must be specified separately.

---

**End of Identity Model**