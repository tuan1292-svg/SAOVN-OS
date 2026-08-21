# SAOVN-OS — MODULE CONTRACT

## 1. Module identity

Every module has a stable id and manifest:

```js
{
  id: 'work',
  version: '1.0.0',
  capabilities: [],
  dependencies: [],
  routes: [],
  navigation: [],
  events: [],
  health: 'function'
}
```

## 2. Dependency rule

Allowed:

`Module → Core Contract`

`Module A → Module B public contract`

Forbidden:

`Module A → Module B internal state`

`Module A → Module B DOM`

`Module A → Module B private Firestore structure`

## 3. Core contracts

The following are shared and must not be reimplemented inside business modules:

- Identity
- Membership
- Organization
- Role
- Capability
- Scope
- Notification
- Audit
- Configuration
- Events
- File reference
- Search reference

## 4. Data ownership

Each collection has one owning module. Other modules consume an API/adapter or a documented read contract.

A module may not silently mutate another module's owned data.

## 5. UI contract

Every business module renders inside the shared Application Shell.

The module receives runtime context:

```text
user
membership
scope
capabilities
configuration
```

The module must not derive security from DOM visibility.

## 6. Error isolation

A failed optional module must not prevent:

- authentication;
- shell boot;
- navigation;
- sibling modules;
- logout;
- notifications.

## 7. Release gate

Before a module is enabled globally:

1. manifest validated;
2. dependencies validated;
3. capability names validated;
4. scope rules validated;
5. backend authorization validated;
6. user-flow regression passed;
7. admin/control-plane regression passed;
8. audit behavior verified.
