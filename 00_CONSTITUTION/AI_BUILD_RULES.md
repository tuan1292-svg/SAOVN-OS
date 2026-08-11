# SAOVN-OS — AI BUILD RULES

# QUY TẮC LÀM VIỆC CỦA AI VỚI SAOVN-OS

> SAOVN-OS — Organizational Operating System & Digital Headquarters
>
> Tài liệu này quy định cách AI đọc, hiểu, đề xuất, xây dựng và cập nhật SAOVN-OS.

---

# 01. PURPOSE — MỤC ĐÍCH

AI tham gia xây dựng SAOVN-OS phải xem toàn bộ Repository là một hệ thống thống nhất.

AI không được xem từng file hoặc từng module như một dự án độc lập.

Mọi quyết định phải phù hợp với:

1. Constitution.
2. Master Blueprint.
3. System Architecture.
4. Domain Model.
5. Module Map.
6. Project State.
7. Các tài liệu liên quan khác.

---

# 02. SOURCE OF TRUTH — NGUỒN THAM CHIẾU

Khi có nhiều tài liệu liên quan, AI phải ưu tiên theo thứ tự:

```text
00_CONSTITUTION/
        ↓
01_ARCHITECTURE/
        ↓
PROJECT_STATE.md
        ↓
Các tài liệu đặc tả liên quan
        ↓
Source Code
```

Nếu có mâu thuẫn giữa các tài liệu, AI không được tự ý chọn một phương án mà phải xác định tài liệu có authority cao hơn.

---

# 03. START OF WORK — BẮT ĐẦU MỘT PHIÊN LÀM VIỆC

Khi bắt đầu một phiên làm việc mới, AI phải:

1. Đọc `START_HERE.md`.
2. Kiểm tra `PROJECT_STATE.md`.
3. Đọc các Constitution Documents liên quan.
4. Đọc Architecture Documents liên quan.
5. Kiểm tra cấu trúc Repository hiện tại.
6. Xác định công việc đang được yêu cầu.
7. Kiểm tra xem nội dung đó đã tồn tại hay chưa.
8. Chỉ sau đó mới đề xuất thay đổi.

Không được giả định Repository đang ở trạng thái ban đầu.

---

# 04. REPOSITORY FIRST — ƯU TIÊN TRẠNG THÁI THỰC TẾ

Repository hiện tại là nguồn sự thật về trạng thái xây dựng.

Trước khi tạo file mới, AI phải kiểm tra:

* File đã tồn tại chưa?
* Nội dung tương tự đã tồn tại ở nơi khác chưa?
* Có tài liệu nào đã định nghĩa vấn đề này chưa?
* File mới có làm trùng lặp kiến trúc không?
* File mới thuộc layer nào?

Không tạo tài liệu chỉ vì muốn có thêm tài liệu.

---

# 05. NO DUPLICATION — KHÔNG XÂY TRÙNG

Một khái niệm chỉ nên có một nguồn định nghĩa chính.

Ví dụ:

* Vision không được trùng với Constitution.
* Architecture không được trùng với Module Map.
* Domain Model không được biến thành Database Schema.
* Project State không được trở thành Architecture Document.

Nếu một tài liệu đã tồn tại nhưng chưa đầy đủ, ưu tiên:

> cập nhật tài liệu hiện có

thay vì:

> tạo một tài liệu mới có cùng mục đích.

---

# 06. DOCUMENT CREATION — QUY TRÌNH TẠO TÀI LIỆU

Khi cần tạo hoặc cập nhật một file, AI phải trình bày theo thứ tự:

### Bước 1 — Giới thiệu

Giải thích ngắn gọn:

* File này dùng để làm gì.
* Vì sao cần file này.
* Nó nằm ở đâu trong kiến trúc tài liệu.

Không lặp lại toàn bộ Vision hoặc Architecture nếu không cần thiết.

### Bước 2 — Nội dung

Cung cấp nội dung hoàn chỉnh để người thực hiện có thể copy vào Repository.

### Bước 3 — Vị trí

Chỉ rõ đường dẫn chính xác của file.

### Bước 4 — Git

Hướng dẫn commit và push.

### Bước 5 — Kiểm tra

Sau khi người thực hiện xác nhận đã push, AI phải kiểm tra Repository và tiếp tục công việc kế tiếp.

---

# 07. ONE STEP AT A TIME — MỖI LẦN MỘT BƯỚC

AI không được đưa ra một danh sách quá dài các thao tác cần thực hiện cùng lúc nếu các bước có quan hệ phụ thuộc.

Ưu tiên:

```text
Define
  ↓
Document
  ↓
Commit
  ↓
Push
  ↓
Verify
  ↓
Next Step
```

Mỗi bước phải tạo ra một trạng thái rõ ràng.

---

# 08. DO NOT REPEAT — KHÔNG LẶP LẠI KHÔNG CẦN THIẾT

AI không cần nhắc lại nhiều lần những quyết định đã được thống nhất.

Ví dụ không cần lặp lại:

* SAOVN-OS là gì.
* Không tạo repo mới.
* Không xây module độc lập.
* Quy trình Git đã thống nhất.
* Những việc đã hoàn thành.

Chỉ nhắc lại khi:

* Có thay đổi.
* Có mâu thuẫn.
* Có nguy cơ hiểu sai.
* Hoặc thông tin đó cần thiết cho quyết định hiện tại.

---

# 09. CHANGE EXISTING DOCUMENTS BEFORE CREATING NEW ONES

Nếu vấn đề có thể giải quyết bằng việc cập nhật một tài liệu hiện có, ưu tiên cập nhật tài liệu đó.

Chỉ tạo file mới khi:

* Có một khái niệm mới thực sự cần một boundary riêng.
* File hiện tại đã vượt quá phạm vi trách nhiệm.
* Kiến trúc tài liệu yêu cầu một document riêng.
* Việc tách file làm hệ thống rõ ràng hơn.

---

# 10. ARCHITECTURE CONSISTENCY — TÍNH NHẤT QUÁN KIẾN TRÚC

Mọi đề xuất phải kiểm tra:

```text
CONSTITUTION
     ↓
MASTER BLUEPRINT
     ↓
SYSTEM ARCHITECTURE
     ↓
DOMAIN MODEL
     ↓
MODULE MAP
     ↓
APPLICATION
     ↓
IMPLEMENTATION
```

Không được xây Application trước khi hiểu Domain và Architecture liên quan.

Không được thay đổi Core chỉ vì một Application cần một tính năng riêng.

---

# 11. CORE FIRST — CORE LÀ NỀN TẢNG

Các Application Module phải sử dụng Core chung của SAOVN-OS.

Core có thể bao gồm:

* Identity.
* Organization.
* Membership.
* Role.
* Permission.
* Audit.
* Notification.
* Files.
* Search.
* Events.

Application không được tự tạo lại các năng lực Core nếu không có lý do kiến trúc rõ ràng.

---

# 12. DOMAIN FIRST — NGHIỆP VỤ TRƯỚC DỮ LIỆU

Khi thiết kế một chức năng nghiệp vụ, AI phải hiểu:

1. Business Concept.
2. Domain Entity.
3. Relationship.
4. Business Rule.
5. Permission.
6. Workflow.
7. Data Representation.

Không được bắt đầu bằng việc tạo bảng database chỉ vì một yêu cầu giao diện xuất hiện.

---

# 13. SECURITY & PERMISSION

Mọi dữ liệu và hành động trong SAOVN-OS phải có ngữ cảnh quyền.

AI phải luôn xem xét:

* User.
* Organization.
* Membership.
* Role.
* Permission.
* Resource.
* Scope.
* Audit.

Không thiết kế chức năng nghiệp vụ mà bỏ qua quyền truy cập.

---

# 14. AI AGENT RULES

AI Agent trong SAOVN-OS là một thành phần của hệ thống, không phải một người dùng có toàn quyền.

AI Agent phải hoạt động trong:

```text
Identity
    ↓
Authorization
    ↓
Tool Access
    ↓
Data Access
    ↓
Action
    ↓
Audit
```

AI không được tự ý giả định quyền truy cập dữ liệu.

Mọi Agent phải có phạm vi trách nhiệm và công cụ được xác định rõ.

---

# 15. IMPLEMENTATION DISCIPLINE

Khi chuyển từ tài liệu sang implementation:

1. Không bỏ qua Architecture.
2. Không bỏ qua Domain Model.
3. Không tự ý thay đổi Core Contract.
4. Không tạo abstraction không có nhu cầu thực tế.
5. Không xây tính năng chỉ để "cho có".
6. Không tạo code trùng với module hiện có.
7. Không thay đổi nhiều layer không liên quan trong một bước.

Implementation phải phản ánh tài liệu, không phải ngược lại.

---

# 16. CHANGE CONTROL

Mỗi thay đổi lớn phải xác định:

* What changed?
* Why?
* Which document is affected?
* Which module is affected?
* Does the Domain Model change?
* Does the Architecture change?
* Does the Permission Model change?
* Does the Project State change?

Nếu thay đổi làm mất tính nhất quán với tài liệu cấp cao hơn, phải xử lý tài liệu trước khi tiếp tục implementation.

---

# 17. GIT DISCIPLINE

Mỗi milestone tài liệu hoặc implementation phải được lưu vào Git.

Nguyên tắc:

```text
Change
 ↓
Review
 ↓
Commit
 ↓
Push
 ↓
Verify
```

Commit message phải mô tả đúng thay đổi.

Ví dụ:

```text
docs: define AI build rules
docs: update system architecture
docs: define identity domain
feat: implement authentication core
fix: correct permission boundary
```

Không sử dụng commit message mơ hồ như:

```text
update
test
change
fix stuff
```

---

# 18. PROJECT STATE

`PROJECT_STATE.md` phải phản ánh trạng thái thực tế của dự án.

Khi một milestone quan trọng hoàn thành, cần cập nhật Project State.

Project State phải giúp một phiên làm việc mới hiểu:

* Đang ở đâu.
* Đã hoàn thành gì.
* Đang làm gì.
* Việc tiếp theo là gì.
* Có vấn đề hoặc quyết định nào đang chờ xử lý.

---

# 19. WHEN UNCERTAIN — KHI KHÔNG CHẮC CHẮN

Nếu AI không đủ thông tin để quyết định một vấn đề quan trọng:

* Không tự bịa.
* Không giả định kiến trúc.
* Không tạo code để che giấu sự thiếu rõ ràng.
* Xác định chính xác điểm chưa rõ.
* Đề xuất các lựa chọn nếu cần.
* Xin quyết định của người phụ trách.

---

# 20. COMPLETION CRITERIA

Một bước chỉ được xem là hoàn thành khi:

```text
Requirement understood
        ↓
Correct document/module identified
        ↓
Change completed
        ↓
Git committed
        ↓
Git pushed
        ↓
Repository verified
```

Không xem một thay đổi local là hoàn thành nếu chưa được lưu vào Repository.

---

# 21. FINAL PRINCIPLE

AI không được xem nhiệm vụ là:

> "Tạo thêm một file."

AI phải xem nhiệm vụ là:

> "Làm cho SAOVN-OS tiến thêm một bước có kiểm soát."

Mỗi thay đổi phải làm hệ thống:

* rõ ràng hơn;
* nhất quán hơn;
* có cấu trúc hơn;
* dễ mở rộng hơn;
* dễ bảo trì hơn;
* và gần hơn với một Organizational Operating System thực tế.

---

# 22. WORKING AGREEMENT

Quy trình làm việc giữa người phụ trách và AI:

```text
REPOSITORY
    ↓
UNDERSTAND CURRENT STATE
    ↓
IDENTIFY NEXT REQUIRED STEP
    ↓
EXPLAIN BRIEFLY
    ↓
PROVIDE COMPLETE CONTENT
    ↓
USER APPLIES CHANGE
    ↓
GIT COMMIT
    ↓
GIT PUSH
    ↓
AI VERIFIES REPOSITORY
    ↓
NEXT STEP
```

Đây là quy trình mặc định cho các phiên xây dựng SAOVN-OS tiếp theo.
