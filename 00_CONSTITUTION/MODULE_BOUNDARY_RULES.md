# SAOVN-OS — MODULE BOUNDARY RULES

**Status:** Mandatory Engineering Rule

## 1. Luật bất biến

> Module mới phải được cắm vào hệ thống; không được làm module cũ phải biết hoặc thay đổi implementation của module mới.

> Permission mới phải được cấp theo capability của module mới; không được mở permission của parent để chữa lỗi của child module.

> Data mới phải có owner rõ ràng; không dùng collection của module khác làm nơi sở hữu mặc định.

## 2. Parent / Child

Parent cung cấp context và contract. Child sở hữu capability của mình.

```text
WORK
├── WORK.TASK
├── WORK.CHECKLIST
├── WORK.COMMENTS
├── WORK.MENTIONS
└── WORK.CHAT
```

`WORK.CHAT` được phép tham chiếu `taskId`, nhưng không được sở hữu checklist/comment/mention data.

## 3. Sibling Isolation

Các sibling module không được gọi trực tiếp implementation của nhau. Giao tiếp qua contract/event/service đã công bố.

## 4. Permission Isolation

Permission namespace phải bắt đầu bằng `moduleId`, ví dụ `WORK.CHAT.READ`, `WORK.CHAT.CREATE`, `WORK.CHAT.UPDATE`, `WORK.CHAT.DELETE`. Không dùng permission chung kiểu `WORK.WRITE` cho mọi child module khi capability cần tách biệt.

## 5. Rule Change Classification

LOW: rule path riêng của plugin. HIGH: helper permission, parent path, shared contract hoặc schema. CRITICAL: Auth, Membership, Organization, global deny hoặc permission primitives. HIGH/CRITICAL bắt buộc regression toàn bộ consumers.

## 6. Shared Code

Shared code chỉ đặt trong Core khi thực sự là primitive dùng chung. Không đẩy logic nghiệp vụ plugin vào shared helper chỉ để giảm số file.

## 7. Cross-module Access

Cross-module access phải khai báo consumer, provider, capability, reason, read/write direction và failure behavior. Mặc định là read/reference; write vào dữ liệu module khác bị cấm trừ khi provider công bố service/command contract rõ ràng.

## 8. Failure Isolation

Nếu plugin không hoạt động: parent vẫn mở, sibling vẫn hoạt động, Core vẫn hoạt động, UI có fallback nếu plugin optional, và permission error của plugin không làm fail toàn trang.

## 9. No Hidden Coupling

Cấm phụ thuộc ngầm qua DOM selector nội bộ, global variable không có contract, collection không khai báo ownership, rule helper dùng cho nhiều module mà không có dependency declaration, hoặc tên field nội bộ của module khác.

## 10. Release Gate

Không release child module nếu parent hoặc sibling đang FAIL regression. Không dùng production user để phát hiện regression.
