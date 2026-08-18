# SAOVN-OS Module Contract Template

Copy this template when a new module is introduced or an existing module is substantially changed.

## Module

- Name:
- Purpose:
- Owner:
- Status:

## Boundary

### UI
- HTML entry points:
- JS entry points:
- CSS entry points:

### Data ownership
- Firestore collections owned:
- Documents/subcollections owned:
- Schema version:

### Permissions

| Actor | Resource | Operation | Scope |
|---|---|---|---|
| ADMIN | | | |
| MANAGER | | | |
| TEAM_LEAD | | | |
| MEMBER | | | |

### Dependencies

- Reads from:
- Writes to:
- Depends on modules:
- Shared utilities:

### Events

#### Emits
- Event:
- Payload:
- Consumers:

#### Consumes
- Event:
- Payload:
- Source:

### Notifications

- Notification type:
- Sender authority:
- Recipient rules:

## Compatibility contract

- Existing behavior that must remain unchanged:
- Existing collections that must not change:
- Existing routes/UI that must remain functional:
- Existing permissions that must remain functional:

## Regression requirements

- [ ] Admin
- [ ] Member
- [ ] Existing module dependencies
- [ ] Security Rules
- [ ] Notifications
- [ ] Cross-module events

## Rollback

- Safe rollback commit:
- Data migration rollback:
- Rule rollback:
