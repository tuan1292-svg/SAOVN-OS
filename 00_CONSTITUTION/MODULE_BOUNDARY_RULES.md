# SAOVN-OS — MODULE BOUNDARY RULES

**Status:** Mandatory Engineering Rule

## 1. Luật bất biến

> Module mới phải được cắm vào hệ thống; không được làm module cũ phải biết hoặc thay đổi implementation của module mới.

> Permission mới phải được cấp theo capability của module mới; không được mở permission của parent để chữa lỗi của child module.

> Data mới phải có owner rõ ràng; không dùng collection của module khác làm nơi sở hữu mặc định.

## 2. Parent / Child

Parent cung cấp context và contract. Child sở hữu capability của mình.

Ví dụ:

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

Các sibling module không được gọi trực tiếp implementation của nhau.

Sai:

```text
WORK.CHAT → work-collab.js private function
```

Đúng:

```text
WORK.CHAT → WORK.TASK contract/event
```

## 4. Permission Isolation

Permission namespace phải bắt đầu bằng `moduleId`.

```text
WORK.CHAT.READ
WORK.CHAT.CREATE
WORK.CHAT.UPDATE
WORK.CHAT.DELETE
```

Không được dùng permission chung kiểu `WORK.WRITE` cho mọi child module nếu capability cần tách biệt.

## 5. Rule Change Classification

### LOW
Chỉ thay đổi rule path riêng của plugin, không dùng shared helper.

### HIGH
Thay đổi helper permission, parent path, shared contract hoặc data schema.

### CRITICAL
Thay đổi Auth, Membership, Organization, global deny, hoặc permission primitives.

HIGH/CRITICAL bắt buộc regression toàn bộ consumers.

## 6. Shared Code

Shared code chỉ được đặt trong Core khi thực sự là primitive dùng chung.

Không đẩy logic nghiệp vụ của plugin vào shared helper chỉ để giảm số file.

## 7. Cross-module Access

Cross-module access phải khai báo:

```text
consumer
provider
capability
reason
read/write direction
failure behavior
```

Mặc định là read/reference. Write vào dữ liệu của module khác bị cấm trừ khi provider công bố service/command contract rõ ràng.

## 8. Failure Isolation

Nếu plugin không hoạt động:

- parent vẫn mở được;
- sibling vẫn hoạt động;
- Core vẫn hoạt động;
- UI phải có fallback nếu plugin optional;
- permission error của plugin không được làm fail toàn trang.

## 9. No Hidden Coupling

Cấm phụ thuộc ngầm qua:

- DOM selector nội bộ;
- global variable không có contract;
- collection không khai báo ownership;
- Firestore rule helper dùng cho nhiều module mà không có dependency declaration;
- tên field nội bộ của module khác.

## 10. Release Gate

Không release child module nếu parent hoặc sibling đang FAIL regression.

Không dùng production user để phát hiện regression.
