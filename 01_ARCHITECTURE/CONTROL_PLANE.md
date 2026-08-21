# SAOVN-OS — ADMIN CONTROL PLANE

## 1. Purpose

Control Plane là hậu phương điều hành hệ thống. Nó quản lý state và policy để Experience Plane phản ánh theo; nó không trở thành một phiên bản khác của Application.

## 2. Responsibilities

- Identity lifecycle
- Membership lifecycle
- Organization structure
- Role definitions
- Capability policy
- Scope policy
- Module enable/disable
- Navigation policy
- Workflow configuration
- System configuration
- Audit and change history

## 3. Runtime configuration contract

Collection:

`systemConfig/{configId}`

MVP document:

`systemConfig/runtime`

Schema:

```json
{
  "version": 1,
  "updatedAt": "server timestamp",
  "modules": {
    "work": { "enabled": true },
    "projects": { "enabled": true }
  },
  "roles": {
    "MEMBER": { "capabilities": [] },
    "MANAGER": { "capabilities": [] },
    "ADMIN": { "capabilities": [] }
  },
  "capabilities": {},
  "navigation": {},
  "workflows": {}
}
```

## 4. Authority

Configuration never grants access by itself.

Security authority remains:

`Authentication → Membership → Backend Authorization / Firestore Rules`

Runtime policy is consumed by frontend for experience and by backend services when backend policy enforcement is available.

## 5. Change propagation

Every configuration change must increase `version` and update `updatedAt`.

Frontend compares the runtime version and rebuilds:

- capability set;
- navigation;
- module availability;
- action guards;
- workflow presentation.

## 6. Safe failure

If runtime configuration cannot be loaded:

- application shell must still boot;
- safe local baseline is used;
- no privilege escalation is allowed;
- admin-only navigation remains hidden;
- data access still relies on backend security.

## 7. Admin UX boundary

Admin Console may manage policy, but normal users never need to understand policy internals.

A normal user sees:

`Work → task list → task → actions`

An administrator sees:

`Control Plane → People / Roles / Permissions / Modules / Policies / Audit`

The two surfaces share the same Core entities and capability vocabulary.

## 8. Non-negotiable rule

Do not create role-specific forks of business modules to solve authorization problems. Fix the policy, scope, capability, or backend enforcement contract instead.
