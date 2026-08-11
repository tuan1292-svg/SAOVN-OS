# SAOVN-OS — Authentication Model

**Status:** Draft  
**Layer:** Core Foundation  
**Owner:** Core  
**Depends On:** Identity Model, Permission Model  
**Consumed By:** Session, Application, Audit, Work Platform

---

## 1. Purpose

Authentication Model defines how SAOVN-OS verifies that an Account is allowed to establish an authenticated session.

Authentication is a Core security concern.

Business modules must not implement their own authentication mechanisms.

Authentication establishes an authenticated actor context.

Authorization determines what that actor is allowed to do.

These responsibilities must remain separate.

---

## 2. Core Principle

SAOVN-OS follows the principle:

```text
Authentication
    ↓
Who are you?

Authorization
    ↓
What may you do?
```

Authentication must never be treated as permission.

A successfully authenticated Account does not automatically receive business permissions.

---

## 3. Authentication Boundary

The authentication boundary begins at the Login entry point.

Conceptually:

```text
Login Request
    ↓
Authentication Mechanism
    ↓
Account Verification
    ↓
Identity Resolution
    ↓
Session Creation
    ↓
Authenticated Context
```

The authenticated context becomes the trusted identity context for subsequent application operations.

---

## 4. Login

Login is the primary entry point for interactive users.

The Login process is responsible for:

- receiving authentication credentials or authentication assertions
- validating the authentication attempt
- resolving the Account
- resolving the Identity
- establishing a Session
- establishing an Authenticated Context

Login is not responsible for business authorization.

---

## 5. Registration Policy

SAOVN-OS does not require public self-registration.

Account provisioning is controlled.

Conceptually:

```text
Public User
    ↓
Login
```

rather than:

```text
Public User
    ↓
Register
    ↓
Create Account
```

The exact provisioning mechanism may be defined by deployment or administrative workflows.

---

## 6. Authentication Methods

The architecture must support authentication as an abstraction rather than coupling the Core model to one specific provider.

Conceptually:

```text
Authentication
├── Password
├── External Identity Provider
├── Enterprise SSO
├── Other Approved Method
└── Future Methods
```

The implementation may initially support only one method.

The architectural model must not prevent additional methods from being introduced later.

---

## 7. Authentication Provider

An authentication provider is responsible for performing the actual verification mechanism.

The provider may be:

- internal
- external
- enterprise-managed
- deployment-specific

The provider must ultimately resolve to an SAOVN-OS Account.

Conceptually:

```text
Authentication Provider
    ↓
Verified Account
    ↓
SAOVN-OS Identity
```

The provider must not become the owner of SAOVN-OS business authorization.

---

## 8. Account Resolution

After successful authentication, the system must resolve the authenticated Account.

Conceptually:

```text
Authentication Result
    ↓
Account
    ↓
Identity
```

If no valid Account can be resolved, authentication must not establish an authenticated SAOVN-OS Session.

---

## 9. Identity Resolution

An authenticated Account must resolve to an Identity.

Conceptually:

```text
Account
    ↓
Identity
```

Identity is the stable actor representation used by the rest of the platform.

Business modules should reference Identity rather than authentication credentials.

---

## 10. Authentication Success

A successful authentication attempt means:

```text
Authentication
    = Verified
```

It does not mean:

```text
Authorization
    = Allowed
```

The subsequent authorization process must still evaluate:

- Identity
- Membership
- Organization
- Role
- Permission
- Resource
- Action
- Scope
- Policy

according to the Permission Model.

---

## 11. Authentication Failure

Authentication failure must not establish an authenticated Session.

Conceptually:

```text
Authentication Attempt
        │
        ├── Success ──→ Session
        │
        └── Failure ──→ No Session
```

Authentication failures may be recorded for security monitoring and auditing.

The exact security response is an implementation concern.

---

## 12. Account State

Authentication must respect Account lifecycle state.

Conceptually:

```text
Account
├── active
├── locked
├── disabled
└── archived
```

Only an Account in an authentication-eligible state may establish a new Session.

The exact state machine may be refined during implementation.

---

## 13. Identity State

Identity lifecycle is separate from Account lifecycle.

For example:

```text
Identity
    = active

Account
    = disabled
```

The Identity may continue to exist as a historical actor even though the Account cannot currently authenticate.

Authentication must therefore evaluate Account state rather than assuming Identity existence implies login availability.

---

## 14. Session Creation

A successful authentication may create a Session.

Conceptually:

```text
Authentication Success
    ↓
Account
    ↓
Identity
    ↓
Session
```

Session creation must only occur after successful authentication.

---

## 15. Session Independence

A Session is a temporary authenticated state.

It is not the Identity.

It is not the Account.

Conceptually:

```text
Identity
    = persistent actor

Account
    = persistent access record

Session
    = temporary authenticated presence
```

---

## 16. Authenticated Context

Every authenticated application request should resolve an Authenticated Context.

Conceptually:

```text
AuthenticatedContext
├── Identity
├── Account
├── Session
├── Organization Context
└── Membership Context
```

The exact implementation may differ.

The architectural responsibility remains the same.

---

## 17. Organization Context

Authentication establishes who the actor is.

It does not automatically establish unlimited access to every Organization.

Organization context must be resolved through Membership.

Conceptually:

```text
Authenticated Identity
        ↓
Membership
        ↓
Organization
```

An actor may have multiple memberships.

The active organization must therefore be explicit when required.

---

## 18. Multiple Organizations

An Identity may belong to multiple Organizations.

Example:

```text
Identity A
    ├── Membership → Organization X
    └── Membership → Organization Y
```

Authentication alone does not grant access across these organizations.

Authorization must be evaluated within the correct organizational context.

---

## 19. Authorization Boundary

Authentication ends when the system has established a trusted authenticated actor context.

Authorization begins after that.

Conceptually:

```text
Login
    ↓
Authentication
    ↓
Authenticated Context
    ↓
Authorization
    ↓
Business Operation
```

This boundary must remain explicit.

---

## 20. Request Authentication

For an authenticated request, the application must be able to determine:

```text
Who is acting?
Which Account is being used?
Which Session established the context?
Which Organization is active?
Which Membership applies?
```

These values should come from trusted server-side authentication context.

---

## 21. Client Input

The client must not be trusted to define the acting Identity.

For example, an API request must not rely on:

```text
{
  "user_id": "..."
}
```

to determine who is performing the operation when an authenticated context already exists.

Instead:

```text
Request
    ↓
Authenticated Context
    ↓
Resolved Identity
```

The client may provide a target user where the business operation explicitly requires one, such as assigning a Task.

That target user is not the same thing as the acting Identity.

---

## 22. Actor vs Target

This distinction is critical for Work.

Example:

```text
Actor
    = Identity A

Target
    = Identity B
```

If Identity A assigns a Task to Identity B:

```text
Identity A
    ↓
creates assignment
    ↓
Task
    ↓
assigned to
    ↓
Identity B
```

Authentication establishes Identity A as the actor.

Authorization determines whether Identity A may perform the assignment.

The Task system records Identity B as the assignee.

---

## 23. Logout

Logout terminates the active authenticated Session.

Conceptually:

```text
Logout
    ↓
Session Revoked / Terminated
    ↓
Authenticated Context Ends
```

Logout does not delete the Identity.

Logout does not delete the Account.

Logout only ends the current authenticated presence.

---

## 24. Session Expiration

Sessions may expire according to implementation-defined security policy.

When a Session expires:

```text
Expired Session
    ↓
No longer authenticated
```

The Identity and Account remain persistent.

A new authentication attempt may establish a new Session if the Account remains eligible.

---

## 25. Session Revocation

The system must support Session revocation.

Revocation may be required for events such as:

- account disablement
- security response
- administrative action
- explicit logout
- session invalidation

After revocation, the Session must no longer establish an authenticated context.

---

## 26. Credential Handling

Authentication credentials are security-sensitive.

Credentials must not be exposed to business modules.

Business modules must never:

- store passwords
- validate passwords
- inspect authentication secrets
- implement independent credential systems

Credential handling belongs to the Authentication layer.

---

## 27. Password Authentication

If password authentication is implemented, the architecture must treat passwords as authentication credentials only.

The specific:

- password hashing algorithm
- password storage mechanism
- password policy
- reset mechanism
- rate limiting
- lockout strategy

are implementation and security-policy concerns.

They must not leak into business modules.

---

## 28. External Authentication

SAOVN-OS may support external authentication providers.

Conceptually:

```text
External Provider
    ↓
Authentication Verification
    ↓
External Identity
    ↓
Account Mapping
    ↓
SAOVN-OS Identity
    ↓
Session
```

External authentication must still resolve to the internal SAOVN-OS Identity model.

---

## 29. Account Mapping

When an external authentication provider is used, the system must maintain a controlled mapping between the external identity and the SAOVN-OS Account.

The mapping must be deterministic and security-aware.

An external identity must not automatically become an unrestricted SAOVN-OS identity.

---

## 30. Authentication Events

Security-significant authentication events should be auditable.

Examples:

```text
Login Attempt
Login Success
Login Failure
Logout
Session Expiration
Session Revocation
Account Lock
Account Disablement
```

Audit implementation is defined separately.

---

## 31. Brute Force and Abuse Protection

Authentication implementation should support appropriate protection against repeated or abusive authentication attempts.

Possible mechanisms include:

- rate limiting
- temporary lockout
- progressive delay
- monitoring
- security alerts

The exact mechanism depends on deployment requirements.

The architecture must preserve the ability to apply these controls.

---

## 32. Security Principle

Authentication must fail closed.

If the system cannot establish a valid authenticated context, the request must not be treated as authenticated.

Conceptually:

```text
Unable to verify
    ↓
Not Authenticated
```

Not:

```text
Unable to verify
    ↓
Assume Identity
```

---

## 33. Authentication and Permission

The relationship between Authentication and Permission is:

```text
Authentication
    ↓
Identity established
    ↓
Membership resolved
    ↓
Permission evaluated
    ↓
Decision
```

Authentication never directly grants a business permission.

---

## 34. Business Module Boundary

Business modules must consume authenticated context.

They must not implement:

- login
- password verification
- session creation
- credential validation
- authentication provider integration

unless explicitly defined as part of the Core Authentication layer.

---

## 35. Work Module Example

The future Work module will rely on Authentication as follows:

```text
User Login
    ↓
Authentication
    ↓
Identity A
    ↓
Authenticated Context
    ↓
Work Module
    ↓
Create Task
```

If Identity A assigns the Task to Identity B:

```text
Actor
    = Identity A

Target
    = Identity B

Resource
    = Task

Action
    = Assign
```

Permission Model then determines whether the action is allowed.

---

## 36. Relationship to Identity Model

The Authentication Model depends on the Identity Model.

```text
Authentication
    ↓
Account
    ↓
Identity
```

The Identity Model defines who the actor is.

The Authentication Model defines how that actor becomes authenticated.

Neither model should absorb the responsibility of the other.

---

## 37. Relationship to Permission Model

The Authentication Model provides the authenticated actor context required by the Permission Model.

```text
Authentication
    ↓
Authenticated Context
    ↓
Permission Model
    ↓
Authorization Decision
```

The Permission Model remains the authority for authorization.

---

## 38. Relationship to Work

Work depends on authenticated context.

```text
Core
├── Identity
├── Account
├── Authentication
└── Session
        ↓
Work
├── Projects
├── Tasks
├── Workflow
├── Approvals
├── Calendar
└── Meetings
```

Work must not bypass Core Authentication.

---

## 39. Prohibited Patterns

The following patterns are prohibited.

### 39.1 Module-specific login

A Work module must not create its own login system.

### 39.2 Module-specific sessions

Business modules must not maintain independent authentication sessions.

### 39.3 Client-defined actor

Business operations must not trust a client-provided actor identifier.

### 39.4 Authentication as authorization

Successful login must not automatically grant business permissions.

### 39.5 Credential leakage

Passwords or authentication secrets must never be exposed to business modules.

### 39.6 Organization bypass

Authentication must not be treated as authorization for every Organization.

---

## 40. Architectural Contract

The following rules are mandatory:

1. Authentication is a Core concern.
2. Authentication establishes an authenticated actor context.
3. Authorization is a separate concern.
4. Identity and Account remain distinct.
5. Session is temporary.
6. Login is the primary entry point.
7. Public self-registration is not required.
8. Account provisioning is controlled.
9. Business modules consume authenticated context.
10. Business modules do not implement independent authentication.
11. Client-provided actor identity must not override authenticated context.
12. Organization access is governed by Membership and Permission.
13. Authentication failures must fail closed.
14. Session revocation must be supported.
15. Authentication events should be auditable.

---

## 41. Future Implementation

This model will later support implementation components such as:

```text
Core Authentication
├── Login
├── Authentication Provider
├── Account Verification
├── Session Management
├── Authenticated Context
└── Logout
```

These components will provide the security boundary required by the application layer.

---

## 42. Status

This document defines the architectural Authentication Model.

Implementation details such as:

- authentication provider selection
- database schema
- password hashing
- session storage
- token strategy
- API contracts
- frontend authentication state
- rate limiting
- security monitoring

must be specified during the appropriate implementation and technical architecture phases.

---

**End of Authentication Model**