# SAOVN-OS — MODULE SYSTEM SPECIFICATION

**Version:** 1.0  
**Status:** Architecture Standard  
**Scope:** Core + application modules + sub-modules

## 1. Mục tiêu

SAOVN-OS được xây theo mô hình **Plug-in Modules**: mỗi module là một boundary có định danh, dữ liệu, permission, UI và contract riêng. Module mới được cắm vào hệ thống thông qua contract; không sửa implementation nội bộ module khác chỉ để tích hợp.

Mục tiêu bắt buộc: thêm module không phá module đang PASS; permission không tự động mở rộng/thu hẹp module khác; dữ liệu có owner duy nhất; liên kết dùng Contract/Service/Event; có thể bật/tắt hoặc rollback module độc lập.

## 2. Hierarchy

```text
SAOVN-OS
└── DOMAIN MODULE
    └── SUB-MODULE / PLUGIN
        └── CAPABILITY
```

Ví dụ: `WORK.TASK`, `WORK.CHECKLIST`, `WORK.COMMENTS`, `WORK.MENTIONS`, `WORK.ANALYTICS`, `WORK.CHAT`.

## 3. Module ID

Quy ước: `<DOMAIN>.<MODULE>[.<CAPABILITY>]`. Module ID đã có dữ liệu production không được đổi; breaking replacement phải dùng version/migration có kiểm soát.

## 4. Module Contract

Mỗi module khai báo tối thiểu:

```yaml
moduleId:
parentModule:
version:
status:
purpose:
ownedEntities:
ownedCollections:
permissions:
dependencies:
providedEvents:
consumedEvents:
uiEntry:
featureFlags:
rollbackBoundary:
regressionSuite:
```

## 5. Permission Isolation

Permission có namespace theo Module ID, ví dụ `WORK.TASK.READ`, `WORK.TASK.UPDATE`, `WORK.CHECKLIST.READ`, `WORK.COMMENTS.CREATE`, `WORK.CHAT.READ`. Dependency không đồng nghĩa ownership; Chat có thể tham chiếu capability `WORK.TASK.READ` nhưng không sao chép rule Task.

## 6. Dependency Direction

Dependency đi một chiều. Không tạo vòng như `WORK.CHAT → WORK.TASK → WORK.CHAT`. Core chỉ cung cấp contract chung.

## 7. Data Boundary

Plugin sở hữu collection riêng khi dữ liệu có lifecycle riêng. Với backward compatibility, subcollection hiện hữu vẫn phải được tổ chức quyền theo plugin contract; không dùng một allow chung cho toàn bộ Work.

## 8. Rule Boundary

Thay đổi `WORK.CHAT` chỉ chạm helper/path/contract liên quan Chat đã khai báo. Thay đổi shared helper là HIGH RISK và phải regression toàn bộ consumers.

## 9. Event Contract

Plugin giao tiếp bằng event schema ổn định, ví dụ `WORK.TASK.OPENED`, `WORK.TASK.UPDATED`, `WORK.COMMENTS.CREATED`, `WORK.CHAT.MESSAGE_CREATED`. Payload chỉ chứa dữ liệu contract cần thiết.

## 10. UI Boundary

Plugin có entry point và DOM ownership riêng. Plugin khác chỉ tương tác qua public component API, event contract hoặc shared UI primitives; không dùng selector nội bộ làm API ngầm.

## 11. Feature Flags

Module mới nên có feature flag trước production rollout, ví dụ `module.work.chat.enabled = false`, sau đó rollout cho Admin/test group rồi toàn tổ chức.

## 12. Versioning

Module có version độc lập như `WORK.CHAT@1.0.0`. Breaking change phải tăng major hoặc có migration/compatibility layer.

## 13. Rollback

Rollback một plugin không được rollback sibling/parent. Migration data phải reversible hoặc có recovery plan.

## 14. Regression Gate

Plugin chỉ release khi unit/module test, permission test, integration contract, parent, sibling và core smoke test đều PASS.

## 15. Anti-Corruption Rule

Không giải quyết lỗi plugin bằng permission parent quá rộng. Phải tìm đúng capability và resource cần cấp quyền.

## 16. Production Rule

`main` là production baseline. Plugin đi qua: `SPEC → CONTRACT → FEATURE BRANCH → IMPLEMENT → PERMISSION TEST → REGRESSION → DRAFT PR → REVIEW → RELEASE`.

## 17. Definition of Done

Plugin hoàn thành khi có Module ID, Contract, owner, collection boundary, permission namespace, dependency declaration, event contract nếu cần, feature flag phù hợp, rollback plan, regression suite, không phá sibling và documentation cập nhật.
