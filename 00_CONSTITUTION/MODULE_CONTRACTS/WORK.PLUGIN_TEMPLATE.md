# SAOVN-OS — WORK PLUGIN CONTRACT TEMPLATE

Copy this template before implementing any new Work child plugin.

## Identity

- Module ID: `WORK.<NAME>`
- Parent: `WORK`
- Version: `1.0.0`
- Status: `PLANNED`

## Purpose

What single capability does this plugin provide?

## Data ownership

- Collections owned:
- Documents/subcollections owned:
- Parent references:
- Migration requirement:

## Permissions

```text
WORK.<NAME>.READ
WORK.<NAME>.CREATE
WORK.<NAME>.UPDATE
WORK.<NAME>.DELETE
```

Define exactly who receives each capability. Parent Task access is a dependency, not an automatic grant to sibling capabilities.

## Dependencies

- Required contracts:
- Optional contracts:
- Forbidden direct dependencies:

## Events

### Consumes

- Event:
- Payload contract:

### Produces

- Event:
- Payload contract:

## UI boundary

- Entry point:
- DOM ownership:
- Loading/error state:
- Must not mutate:

## Failure isolation

If this plugin fails, which parent/sibling experiences must remain operational?

## Regression gate

- [ ] Task
- [ ] Checklist
- [ ] Comments
- [ ] Mentions
- [ ] Analytics
- [ ] Chat
- [ ] Login/Auth
- [ ] Notifications

## Rollback

- Feature flag:
- Data rollback/migration:
- Code rollback boundary:

## Definition of done

- [ ] Registered in MODULE_REGISTRY.md
- [ ] Contract reviewed
- [ ] Permission namespace isolated
- [ ] Data ownership isolated
- [ ] Dependencies declared
- [ ] Events documented
- [ ] Failure isolation verified
- [ ] Regression passes
