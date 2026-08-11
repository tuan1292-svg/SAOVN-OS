# SAOVN-OS — Session Model

**Status:** Draft  
**Layer:** Core Foundation  
**Owner:** Core  
**Depends On:** Identity Model, Authentication Model, Permission Model  
**Consumed By:** Application, API, Work Platform, Audit

---

## 1. Purpose

Session Model defines the lifecycle and architectural behavior of an authenticated session in SAOVN-OS.

A Session represents a temporary authenticated presence of an Account after successful authentication.

Session is a Core concern.

Business modules must consume authenticated context from Core and must not implement their own session systems.

---

## 2. Core Principle

SAOVN-OS separates:

```text
Identity
    = persistent actor

Account
    = persistent access record

Session
    = temporary authenticated presence
```

A Session must never be treated as the Identity itself.

---

## 3. Session Lifecycle

A Session follows a controlled lifecycle.

Conceptually:

```text
Authentication Success
        ↓
Session Created
        ↓
Session Active
        ↓
Session Expired / Revoked / Logged Out
        ↓
Session Inactive
```

An inactive Session must no longer establish an authenticated context.

---

## 4. Session Creation

A Session may only be created after successful authentication.

Conceptually:

```text
Login Request
    ↓
Authentication
    ↓
Account Verification
    ↓
Identity Resolution
    ↓
Session Creation
```

Failed authentication must never create an authenticated Session.

---

## 5. Session Ownership

A Session belongs to an Account.

Conceptually:

```text
Account
    ↓
Session
    ↓
Authenticated Context
    ↓
Identity
```

The Account provides the persistent access identity.

The Session represents the temporary authenticated state.

---

## 6. Identity Resolution

A Session must resolve to the Identity associated with its Account.

Conceptually:

```text
Session
    ↓
Account
    ↓
Identity
```

Business operations should use the resolved Identity as the actor.

---

## 7. Session State

A Session should have an explicit lifecycle state.

Conceptually:

```text
Session
├── active
├── expired
├── revoked
└── logged_out
```

The implementation may represent these states differently.

The architectural distinction must remain.

---

## 8. Active Session

An active Session represents a currently valid authenticated presence.

An active Session may establish an Authenticated Context if:

- the Session itself is valid
- the Account remains authentication-eligible
- required security conditions remain satisfied

A Session must not remain trusted merely because it was once valid.

---

## 9. Expired Session

A Session becomes expired when its permitted lifetime ends.

Conceptually:

```text
Active Session
    ↓
Lifetime Exceeded
    ↓
Expired
```

An expired Session must not authenticate further requests.

A new authentication flow may establish a new Session.

---

## 10. Revoked Session

A Session may be revoked before its normal expiration time.

Possible causes include:

- administrative action
- security incident
- account disablement
- credential compromise
- explicit session termination
- security policy

Conceptually:

```text
Active Session
    ↓
Revocation
    ↓
Revoked
```

A revoked Session must immediately cease to be valid.

---

## 11. Logout

Logout terminates the current authenticated Session.

Conceptually:

```text
Authenticated Session
    ↓
Logout
    ↓
Session Terminated
    ↓
No Authenticated Context
```

Logout does not delete:

- Identity
- Account
- historical business records

It only terminates the current authenticated presence.

---

## 12. Multiple Sessions

An Account may have multiple Sessions.

Example:

```text
Account A
├── Session 1
├── Session 2
└── Session 3
```

Each Session must have an independent lifecycle.

One Session being terminated does not automatically terminate all other Sessions unless explicitly required by security policy.

---

## 13. Session Management

The system should support management of active Sessions.

Conceptually:

```text
Account
    ↓
Active Sessions
    ├── Current Device
    ├── Other Device
    └── Other Session
```

Future application functionality may allow an authorized user or administrator to inspect or terminate sessions according to policy.

---

## 14. Current Session

An authenticated request should be able to identify the Session that established the current authenticated context.

Conceptually:

```text
Request
    ↓
Session
    ↓
Account
    ↓
Identity
```

The current Session identifier must originate from trusted authentication state.

---

## 15. Session Identifier

Each Session must have a unique identifier or equivalent secure reference.

The identifier must not be predictable.

The exact representation is an implementation concern.

The architectural requirement is:

> A Session must be uniquely and securely distinguishable.

---

## 16. Session Secret

If a Session uses a secret, token, cookie, or equivalent credential, that value is security-sensitive.

Session secrets must:

- be generated securely
- not be predictable
- not be exposed to business modules
- not be logged as plaintext
- be invalidated when the Session is revoked

The exact mechanism is defined during technical implementation.

---

## 17. Client Session Storage

The architecture does not mandate one specific client-side storage mechanism.

Possible implementations may include:

- secure cookies
- server-managed sessions
- token-based mechanisms
- other approved mechanisms

The selected implementation must satisfy the security requirements of the deployment.

---

## 18. Server Trust Boundary

The server must determine Session validity.

The client must not be trusted to declare:

```text
session_active = true
```

or equivalent.

The trusted flow is:

```text
Client Request
    ↓
Server Session Validation
    ↓
Authenticated Context
```

---

## 19. Session Validation

An authenticated request must validate the Session before treating the request as authenticated.

Conceptually:

```text
Request
    ↓
Extract Session Context
    ↓
Validate Session
    ↓
Validate Account State
    ↓
Resolve Identity
    ↓
Authenticated Context
```

Failure at any required step must result in an unauthenticated request.

---

## 20. Account Disablement

If an Account becomes disabled while Sessions remain active, those Sessions must no longer provide access.

Conceptually:

```text
Active Session
      +
Account Disabled
      ↓
Session Invalid
```

The system should support revocation or equivalent invalidation of affected Sessions.

---

## 21. Account Lock

Account lock may temporarily prevent authentication.

Depending on security policy, an account lock may also invalidate existing Sessions.

The exact behavior must be defined by the security policy.

The architecture must support both possibilities.

---

## 22. Identity Deactivation

Identity lifecycle and Session lifecycle are separate.

If an Identity becomes inactive, the system must prevent continued authenticated access according to the defined security policy.

Historical references to the Identity must remain available where required.

---

## 23. Organization Context

A Session establishes authenticated presence.

It does not automatically grant unrestricted Organization access.

Organization access is resolved through Membership and Permission.

Conceptually:

```text
Session
    ↓
Identity
    ↓
Membership
    ↓
Organization Context
    ↓
Permission
```

---

## 24. Active Organization

A user may belong to multiple Organizations.

Therefore an authenticated application may need an active Organization context.

Example:

```text
Identity A
├── Membership → Organization X
└── Membership → Organization Y
```

The active Organization must be explicit when an operation requires organizational context.

---

## 25. Organization Switching

If the application supports switching Organizations, the switch must be treated as a context change.

Conceptually:

```text
Current Organization
        ↓
Organization Switch
        ↓
Membership Resolution
        ↓
New Organization Context
        ↓
Permission Evaluation
```

Switching Organizations must not itself grant new permissions.

The new Membership and Permission context must be evaluated independently.

---

## 26. Permission Evaluation

Session establishes the authenticated actor context required for authorization.

It does not make authorization decisions.

The relationship is:

```text
Session
    ↓
Authenticated Context
    ↓
Permission Model
    ↓
Authorization Decision
```

The Permission Model remains authoritative.

---

## 27. Request Context

An authenticated request should be able to resolve:

```text
Request Context
├── Session
├── Account
├── Identity
├── Organization
└── Membership
```

Additional context may be resolved as required by the application.

The exact object structure is an implementation concern.

---

## 28. Actor Resolution

The actor performing an operation must be resolved from the authenticated context.

Example:

```text
Session
    ↓
Identity A
    ↓
Create Task
```

The Task module must not accept an arbitrary client-provided actor identifier as the source of truth.

---

## 29. Actor and Target

Session identifies the actor.

Business input may identify a target.

Example:

```text
Actor
    = Identity A

Target
    = Identity B
```

For Task assignment:

```text
Identity A
    ↓
Assign Task
    ↓
Identity B
```

Session authenticates Identity A.

Permission determines whether Identity A may assign the Task.

The Task records Identity B as the assignee.

---

## 30. Session and Audit

Security-significant Session events should be auditable.

Examples include:

```text
Session Created
Session Expired
Session Revoked
Logout
Organization Context Changed
```

Audit records should identify the relevant actor and event context.

Session secrets must never be recorded as plaintext audit data.

---

## 31. Session Expiration Policy

Session lifetime is a security-policy concern.

The implementation may define:

- absolute lifetime
- idle lifetime
- renewal behavior
- re-authentication requirements

The architecture must support explicit expiration.

---

## 32. Idle Expiration

If idle expiration is implemented:

```text
Active Session
    ↓
No Activity
    ↓
Idle Timeout
    ↓
Expired
```

The exact timeout is a deployment or security-policy decision.

---

## 33. Absolute Expiration

A Session may have an absolute maximum lifetime.

Conceptually:

```text
Session Created
    ↓
Maximum Lifetime Reached
    ↓
Expired
```

Renewal must not allow a Session to bypass the maximum security lifetime if such a policy is enforced.

---

## 34. Session Renewal

The implementation may support Session renewal.

Renewal must not silently change:

- Identity
- Account
- security principal

If Organization context or permissions change, those changes must be resolved according to current Membership and Permission state.

---

## 35. Permission Changes

A Session does not permanently cache authorization decisions.

If a user's permission changes while a Session remains active, subsequent authorization should reflect the current authorization state according to system policy.

Conceptually:

```text
Active Session
      ↓
Current Membership / Permission
      ↓
Current Authorization Decision
```

This prevents an old Session from becoming a permanent authorization bypass.

---

## 36. Membership Removal

If an Identity is removed from an Organization while a Session remains active:

```text
Session
    ↓
Identity
    ↓
Membership Removed
    ↓
No Access to Organization
```

The Session itself may remain valid for other Organizations if permitted.

Authorization must evaluate the current Membership state.

---

## 37. Security Boundary

Session validation is part of the authentication security boundary.

The system must fail closed.

Conceptually:

```text
Session Valid
    ↓
Authenticated

Session Invalid
    ↓
Unauthenticated
```

The system must never assume validity when validation cannot be completed reliably.

---

## 38. Session Enumeration

Session identifiers and authentication state must not be unnecessarily exposed.

Administrative or user-facing session management must expose only information appropriate to the authorized viewer.

Sensitive session secrets must never be displayed.

---

## 39. Session Revocation Strategy

The architecture must allow individual Session revocation.

It should also allow broader revocation policies where required.

Examples:

```text
Revoke Current Session
Revoke Selected Session
Revoke All Sessions
Revoke All Sessions After Security Event
```

Authorization for these operations is defined by the Permission Model.

---

## 40. Security Event Response

A security event may require immediate Session invalidation.

Conceptually:

```text
Security Event
    ↓
Identify Affected Sessions
    ↓
Revoke
    ↓
Prevent Further Authenticated Access
```

The exact incident-response workflow is outside this model.

---

## 41. Session and Authentication Boundary

Authentication creates the Session.

Session maintains the authenticated state.

Conceptually:

```text
Authentication
    ↓
Create Session

Session
    ↓
Maintain Authenticated Context
```

Authentication and Session Management are related but remain separate responsibilities.

---

## 42. Session and Identity Boundary

Identity is persistent.

Session is temporary.

Therefore:

```text
Identity
    ≠
Session
```

Deleting or terminating a Session must never delete the Identity.

---

## 43. Session and Account Boundary

Account is persistent.

Session is temporary.

Therefore:

```text
Account
    ≠
Session
```

An Account may have zero, one, or multiple Sessions.

---

## 44. Business Module Boundary

Business modules must consume Session-derived Authenticated Context.

They must not:

- create Sessions
- validate authentication secrets
- revoke authentication outside approved Core interfaces
- maintain independent session state for authentication

Business-specific temporary state is a separate concern.

---

## 45. Work Module Example

The future Work module will consume Session context like this:

```text
User
    ↓
Login
    ↓
Authentication
    ↓
Session
    ↓
Authenticated Context
    ↓
Work
```

For a Task operation:

```text
Actor
    = Identity A

Session
    = Session X

Resource
    = Task 123

Action
    = Assign

Target
    = Identity B
```

The Session establishes the actor context.

The Permission Model decides whether the action is allowed.

The Work module performs the business operation.

---

## 46. Prohibited Patterns

The following patterns are prohibited.

### 46.1 Business-specific authentication sessions

A business module must not create an independent login Session.

### 46.2 Client-controlled session validity

The client must not determine whether a Session is valid.

### 46.3 Session as Identity

A Session must not be treated as a permanent actor record.

### 46.4 Session as Permission

A valid Session must not automatically grant business permissions.

### 46.5 Organization bypass

An active Session must not automatically grant access to every Organization.

### 46.6 Ignoring Account state

A Session must not remain trusted when the Account is no longer authentication-eligible.

### 46.7 Logging secrets

Session secrets must not be stored in plaintext logs or audit records.

---

## 47. Architectural Contract

The following rules are mandatory:

1. Session is a Core concern.
2. Session represents temporary authenticated presence.
3. Session is created only after successful authentication.
4. Session resolves to an Account.
5. Account resolves to an Identity.
6. Session validity is determined server-side.
7. Invalid Sessions must fail closed.
8. Session expiration must be supported.
9. Session revocation must be supported.
10. Logout terminates the current Session.
11. Multiple Sessions may exist for one Account.
12. Organization context is resolved through Membership.
13. Authorization remains under the Permission Model.
14. Business modules consume authenticated context.
15. Business modules do not create independent authentication Sessions.
16. Session secrets are security-sensitive.
17. Permission changes must be respected according to current authorization state.
18. Membership removal must prevent unauthorized organizational access.

---

## 48. Future Implementation

This model will later support implementation components such as:

```text
Core Session
├── Session Creation
├── Session Validation
├── Session Expiration
├── Session Revocation
├── Logout
├── Active Session Management
└── Authenticated Context
```

These components provide the authenticated runtime context required by the application.

---

## 49. Status

This document defines the architectural Session Model.

Implementation details such as:

- session storage
- cookie strategy
- token strategy
- expiration configuration
- renewal mechanism
- revocation mechanism
- distributed session handling
- API contracts
- frontend session state

must be defined during the appropriate technical architecture and implementation phases.

---

**End of Session Model**