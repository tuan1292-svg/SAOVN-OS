# SAOVN-OS Engineering Change Control

## 1. Purpose

SAOVN-OS is a production system used by employees. Stability and backward compatibility are mandatory. New modules must be attached to the system without breaking existing modules.

## 2. Non-negotiable principles

1. **Production first:** `main` represents the production baseline. Do not experiment directly on `main`.
2. **No regression:** an existing PASS feature must remain PASS after a change.
3. **Module isolation:** a new feature must have a defined module boundary, data contract, permission contract, and UI/JS entry points.
4. **Least privilege:** never broaden Firestore access merely to remove a `permission-denied` error.
5. **Small changes:** one change should have one clear purpose and a limited file scope.
6. **Rollback ready:** every production change must be traceable to a commit and reversible.
7. **Evidence before release:** no change is complete until its affected regression checks have passed.

## 3. Change classes

### LOW
Presentation-only changes isolated to one module. No data, auth, rules, or shared code changes.

### MEDIUM
Module logic, Firebase queries, module data writes, or shared UI events.

### HIGH
Authentication, Firestore Rules, shared utilities, data schema, cross-module events, notifications, or changes affecting multiple modules.

### CRITICAL
Production data migrations, destructive operations, permission model changes that affect multiple domains, or changes that can block employee access.

HIGH and CRITICAL changes require explicit impact analysis and regression evidence before release.

## 4. Standard workflow

`BASELINE -> IMPACT -> CHANGE -> TEST -> REGRESSION -> RELEASE`

### BASELINE
Record:
- current production commit
- affected module
- current behavior
- known open defects

### IMPACT
Before editing, list:
- files to change
- modules that consume those files
- Firestore collections/documents affected
- permission changes
- cross-module events or shared functions affected
- regression checks required

### CHANGE
- Work on `feature/*`, `fix/*`, `hotfix/*`, or `chore/*` branches.
- Keep the change narrowly scoped.
- Do not combine unrelated fixes.
- Do not silently change schemas or permissions.

### TEST
Test the changed behavior with the real Admin and Member roles when permissions are involved.

### REGRESSION
Run the required checks from `DOCS/QA/REGRESSION_MATRIX.md`. A failed regression blocks release.

### RELEASE
Only a reviewed, tested branch may merge to `main`. Production changes must have a clear commit and rollback point.

## 5. Firestore Rules policy

`firestore.rules` is a high-risk shared system boundary.

Before changing it, document:
- actor
- resource
- operation (read/create/update/delete)
- business reason
- allowed scope
- affected modules
- regression tests

A `permission-denied` error is not by itself a reason to grant broader access.

## 6. Module contract

Every module should define:

- purpose
- owned UI entry points
- owned JS/CSS
- Firestore collections it owns
- read/write contract
- permission contract
- events it emits
- events it consumes
- notifications it creates
- dependencies on other modules

Modules should communicate through explicit contracts rather than hidden coupling.

## 7. Release gate

A change is **NOT SAFE TO RELEASE** if any of these is true:

- login for Admin or Member is broken
- an existing Work operation regresses
- Chat or Notifications regress
- Attendance regresses
- Firestore Rules are not verified
- a new permission is broader than documented
- a production data migration has no rollback plan

## 8. Emergency hotfix

If production is blocking employees:

1. identify the last known good commit
2. reproduce or isolate the failure
3. use `hotfix/*`
4. make the smallest safe correction
5. run the affected regression set
6. release
7. create a follow-up issue for root-cause hardening

## 9. Definition of Done

A feature is complete only when:

- implementation is complete
- module contract is preserved
- security rules are verified
- changed behavior passes
- affected regression checks pass
- production commit is traceable
- project state is updated at the checkpoint
