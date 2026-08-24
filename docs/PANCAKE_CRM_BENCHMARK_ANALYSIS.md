# Pancake CRM — Nghiên cứu Chi tiết, Đối chuẩn Tính năng & Lộ trình Phát triển cho Crove CRM

> **Tài liệu tham chiếu & đối chuẩn (Benchmark Document)**  
> **Nguồn nghiên cứu:** Pancake CRM (`crm.pancake.vn` / `crm.pancake.biz`), Pancake Ecosystem (POS, Botcake, Webcake, Work, Fintab) và giao diện thực tế hệ thống.  
> **Hệ thống đối chuẩn:** Crove CRM (Nền tảng Twenty CRM Upstream Fork + Crove OS Ecosystem).  
> **Ngày cập nhật:** 24/08/2026

---

## 1. Tổng quan về Pancake CRM & Hệ sinh thái Pancake

Pancake CRM là nền tảng quản trị quan hệ khách hàng và tối ưu hiệu suất bán hàng - marketing đa kênh được phát triển riêng cho thị trường Việt Nam & Đông Nam Á, phục vụ mạnh mẽ các ngành dịch vụ (Spa, Thẩm mỹ viện, Phòng khám/Clinics, Giáo dục/Trung tâm Tiếng Anh, Bất động sản, Du lịch/Lữ hành, Bán lẻ dịch vụ).

### 1.1. Các trụ cột chính trong hệ sinh thái Pancake
1. **Pancake Inbox / Social CRM**: Hợp nhất hội thoại đa kênh (Facebook Fanpage, Instagram, Zalo OA, TikTok Shop, Shopee, WhatsApp, Website Chat Plugin).
2. **Pancake POS**: Quản lý bán hàng, kho vận, tạo đơn trực tiếp từ hội thoại, tích hợp đơn vị vận chuyển.
3. **Pancake CRM (`crm.pancake.vn`)**: Quản lý vòng đời khách hàng 360°, Phễu tiềm năng (Leads Pipeline), Lịch hẹn (Appointments), Sản phẩm & Dịch vụ, Đơn hàng, Ticket/Vấn đề, Chăm sóc tự động (ZNS, SMS, Email), Phân tích phễu chuyển đổi và đồng bộ Conversion API (CAPI).
4. **Botcake**: Nền tảng AI Chatbot tự động hóa kịch bản nhắn tin và tương tác theo phễu.
5. **Webcake**: Nền tảng thiết kế Landing Page và Storefront thu thập Leads tự động.

---

## 2. Phân tích Chi tiết Gói cước (Pricing Plans)

Dựa trên bảng giá chính thức của Pancake CRM:

![Pancake CRM Pricing](C:/Users/JOY/.cursor/projects/d-Projects-Crove-CRM/assets/c__Users_JOY_AppData_Roaming_Cursor_User_workspaceStorage_66df00e95fc3baac26444f4ebd0f8c50_images_image-d6865951-baec-4dd5-84b0-a8bcd5971440.png)

### 2.1. Bảng giá các gói cước

| Gói cước | Đối tượng mục tiêu | Mức giá (3 tháng) | Số lượng nhân viên | Tính năng bao gồm |
| :--- | :--- | :--- | :--- | :--- |
| **Basic** | Cá nhân, tổ chức, mới bắt đầu kinh doanh | **720.000 đ** *(~240k/tháng)* | **3 nhân viên** | Toàn bộ tính năng cốt lõi (Quản lý dữ liệu & Kết nối mở rộng) |
| **Standard** *(Phổ biến nhất)* | Giải pháp quản trị toàn diện cho SME vừa và nhỏ | **2.400.000 đ** *(~800k/tháng)* | **10 nhân viên** | Toàn bộ tính năng cốt lõi, hỗ trợ quy mô team 10 người |
| **Pro** *(Tối ưu nhất)* | Doanh nghiệp có quy mô lớn, tăng trưởng nhanh | **3.600.000 đ** *(~1.200k/tháng)* | **15 nhân viên** | Toàn bộ tính năng, hỗ trợ mở rộng và ưu tiên băng thông API |
| **Gói linh hoạt (Tùy chỉnh)** | Doanh nghiệp có nhu cầu đặc thù | Báo giá theo seat/thời hạn | Tùy chọn số lượng | Tùy biến thời hạn (3, 6, 12 tháng) và số user linh hoạt |

### 2.2. Nhóm tính năng chính áp dụng mọi gói cước
* **Quản lý dữ liệu**:
  - Hồ sơ khách hàng 360°
  - Tổng hợp dữ liệu khách hàng đa kênh (Social, Web, Ads, POS)
  - Quản lý cơ hội bán hàng theo từng giai đoạn (Sales Pipeline)
  - Gửi Email, ZNS (Zalo Notification Service), SMS tự động theo kịch bản
* **Kết nối mở rộng**:
  - Hệ thống thu thập & xử lý khiếu nại (Vấn đề / Tickets)
  - Đồng bộ API quảng cáo (Facebook CAPI, TikTok CAPI)
  - Báo cáo linh hoạt theo thời gian thực (Real-time Analytics)
  - Template mẫu theo ngành (Spa, Giáo dục, Bất động sản, Du lịch,...)

---

## 3. Kiến trúc UI & Các Phân hệ Chức năng của Pancake CRM

### 3.1. Dashboard / Trang chủ Tổng quan
![Pancake Dashboard](C:/Users/JOY/.cursor/projects/d-Projects-Crove-CRM/assets/c__Users_JOY_AppData_Roaming_Cursor_User_workspaceStorage_66df00e95fc3baac26444f4ebd0f8c50_images_image-b0513629-3ab9-44bc-9c95-ed5230ed4ef1.png)

* **Thẻ chỉ số (Metric Cards)**: Doanh thu (kèm % tăng giảm so với kỳ trước), Đơn hàng mới, Liên hệ mới, Tỷ lệ chuyển đổi.
* **Biểu đồ tỷ lệ đơn thành công**: Donut chart trực quan thể hiện tỷ lệ đơn chốt thành công.
* **Báo cáo doanh thu so sánh**: Line chart so sánh đa chu kỳ (Tháng này vs Tháng trước).
* **Cơ cấu doanh thu theo nguồn**: Pie chart phân bổ doanh thu từ Website, Sự kiện, Hội chợ, Giới thiệu, Direct, Ads.
* **Tổng số liên hệ theo nguồn**: Bar chart ngang xếp hạng nguồn mang lại nhiều Leads nhất.
* **Mục tiêu doanh thu (Sales Target)**: Thanh đo tiến độ hoàn thành chỉ tiêu doanh thu trong tháng.

### 3.2. Phân hệ Bán hàng — Sản phẩm & Dịch vụ (Products & Services)
![Pancake Products](C:/Users/JOY/.cursor/projects/d-Projects-Crove-CRM/assets/c__Users_JOY_AppData_Roaming_Cursor_User_workspaceStorage_66df00e95fc3baac26444f4ebd0f8c50_images_image-068a792b-316d-48c7-af5b-a1e1ccbb6dda.png)

* **Trường dữ liệu Sản phẩm**: Tên sản phẩm, Mã sản phẩm (SKU), Loại hình (`Sản phẩm`, `Dịch vụ`, `Gói dịch vụ`), Số mẫu mã (Variants), Hình ảnh, Giá bán, Số lượng tồn kho, **Thời lượng (Phút)** (đặc thù rất quan trọng cho ngành Dịch vụ / Spa / Khám bệnh / Tư vấn), Mô tả.
* **Bộ lọc & Phân loại**: Lọc nhanh theo Loại hình, Danh mục sản phẩm, Tìm kiếm nhanh, Ẩn/Hiện cột linh hoạt.

### 3.3. Phân hệ Bán hàng — Đơn hàng (Orders)
![Pancake Orders](C:/Users/JOY/.cursor/projects/d-Projects-Crove-CRM/assets/c__Users_JOY_AppData_Roaming_Cursor_User_workspaceStorage_66df00e95fc3baac26444f4ebd0f8c50_images_image-a7b6edda-c0ca-4030-bd2f-a93dad318103.png)

* **Thông tin Đơn hàng**: Mã đơn hàng (`OD00031...`), Khách hàng liên hệ, Số điện thoại, Danh sách sản phẩm (Nhiều sản phẩm / Chi tiết SKU), Tổng tiền đơn hàng, Giảm giá (Chiết khấu), Còn lại (Số tiền chưa thanh toán), Nguồn đơn (Hội chợ, Sự kiện, Website, Giới thiệu, Fanpage...), Ghi chú đơn hàng, Trạng thái (`Mới`, `Đang xử lý`, `Hoàn thành`, `Đã hủy`).
* **Bộ lọc đơn hàng**: Phân công sales, Trạng thái đơn, Thời điểm tạo, Người tạo đơn, Nguồn đơn hàng.

### 3.4. Phân hệ Thống kê — Báo cáo Khách hàng & Phễu (Customer Analytics)
![Pancake Customer Analytics](C:/Users/JOY/.cursor/projects/d-Projects-Crove-CRM/assets/c__Users_JOY_AppData_Roaming_Cursor_User_workspaceStorage_66df00e95fc3baac26444f4ebd0f8c50_images_image-60f7d354-11a8-4344-b4f1-aab6dbb25eb9.png)

* **Tổng quan tiềm năng**: Số tiềm năng mới, Số lượng đang chăm sóc, Số lượng đã chuyển đổi, Số lượng không tiềm năng (Lost / Junk).
* **Phân tích Nhân khẩu học Khách hàng**:
  - Giới tính (Nam, Nữ, Chưa xác định).
  - Độ tuổi (Dưới 18, 18-24, 25-34, 35-44, 45-54, Trên 55 tuổi; Tỷ lệ có ngày sinh / Không có ngày sinh).
* **Phễu chuyển đổi Tiềm năng (Conversion Funnel)**: Trực quan hóa từng bước từ Lead Mới → Đang tư vấn → Đặt hẹn → Chốt đơn / Hủy.
* **Thống kê theo trạng thái & Nguồn**.

### 3.5. Phân hệ Cấu hình Hệ thống (System Settings)
![Pancake Settings](C:/Users/JOY/.cursor/projects/d-Projects-Crove-CRM/assets/c__Users_JOY_AppData_Roaming_Cursor_User_workspaceStorage_66df00e95fc3baac26444f4ebd0f8c50_images_image-814bcac8-574b-4858-adf0-cfce4199883e.png)

* **Menu Cấu hình**:
  1. *Cài đặt chung*: Tiền tệ (VND, USD), Tên/Avatar workspace, Nguồn khách hàng, Thông báo bản ghi mới, Hiển thị khách trùng SĐT, Quốc gia, Múi giờ, Quản lý xóa Workspace.
  2. *Kết nối (Integrations)*: Zalo Cloud (ZNS), SMS/eSMS, POS, Webcake, Google Sheets, Xendit/Cổng thanh toán.
  3. *Tự động hoá (Automations)*: Trigger kịch bản khi đổi stage/status, gửi tin nhắn tự động.
  4. *Sự kiện chuyển đổi (CAPI)*: Facebook Pixel CAPI, TikTok Events API.
  5. *Trợ lý AI*: Cấu hình AI Assistant / Chatbot kịch bản tư vấn.
  6. *Tệp khách hàng (Customer Segments)*: Phân đoạn tập khách hàng theo điều kiện.
  7. *Công cụ (Tools)*: Webhooks, API Keys, Import/Export Excel.
  8. *Phân quyền (RBAC)*: Vai trò, quyền hạn truy cập theo phòng ban/hồ sơ.
  9. *Chi nhánh (Multi-branch)*: Quản lý nhiều cơ sở / cửa hàng / phòng khám.
  10. *Lịch sử (Audit Log)*: Lịch sử thao tác bản ghi.

---

## 4. Bảng So sánh Đối chuẩn Chi tiết: Pancake CRM vs Crove CRM (Twenty Fork)

| Nhóm chức năng | Tính năng chi tiết của Pancake CRM | Trạng thái ở Crove CRM (Hiện tại) | Đánh giá độ khó triển khai | Giải pháp kỹ thuật & Kiến trúc đề xuất |
| :--- | :--- | :--- | :--- | :--- |
| **1. Quản lý Khách hàng & Dữ liệu 360°** | • Bảng Liên hệ (Contacts / Person)<br>• Bảng Doanh nghiệp (Company / Account)<br>• Trường tùy biến không giới hạn<br>• Lịch sử tương tác timeline |  **ĐÃ CÓ (Vượt trội)**<br>Twenty ORM hỗ trợ Dynamic Schemas, Metadata Engine, Full-text Search, Custom Fields, Timeline Activities cực kỳ mạnh mẽ. | Rất Dễ (Đã hoàn thiện) | Tận dụng nguyên bản Metadata Engine của Twenty. |
| **2. Báo trùng Số điện thoại** | • Cảnh báo trùng SĐT khi nhập<br>• Hiển thị lịch sử hội thoại của cùng SĐT | 🟡 **CÓ MỘT PHẦN**<br>Twenty có validation unique, nhưng chưa có UI cảnh báo pop-over/gợi ý gộp trùng chuyên biệt cho thị trường VN. | **Dễ (Easy)** | Viết thêm Validation Hook / Frontend Interceptor khi gõ trường `phones` để query check trùng và hiển thị warning badge. |
| **3. Cơ hội Bán hàng (Sales Pipelines)** | • Quản lý cơ hội theo giai đoạn (Pipeline/Stages)<br>• Kanban view & Table view<br>• Phân công nhân viên xử lý |  **ĐÃ CÓ (Vượt trội)**<br>Standard Object `opportunity` hỗ trợ Kanban drag-and-drop, bộ lọc nâng cao, phân công `workspaceMember`. | Rất Dễ (Đã hoàn thiện) | Tận dụng nguyên bản Twenty Kanban Pipeline. |
| **4. Lịch hẹn (Appointments / Bookings)** | • Bảng Lịch hẹn chuyên biệt cho Spa, Clinic, Tư vấn<br>• Nhắc hẹn tự động | 🟢 **ĐÃ CÓ & MỞ RỘNG**<br>• Twenty có `calendarEvent`<br>• Crove OS có hệ sinh thái `cal.crove.com` (Cal.com fork) chuyên sâu về booking. | **Dễ - Trung bình** | Tạo Standalone View/App `Appointment` liên kết với `cal.crove.com` qua Webhook/Sync logic. |
| **5. Phân hệ Sản phẩm & Dịch vụ** | • Quản lý SKU, Tên, Giá, Ảnh, Tồn kho<br>• Phân loại: Sản phẩm / Dịch vụ / Gói dịch vụ<br>• **Trường Thời lượng (Phút)** cho dịch vụ | 🔴 **CHƯA CÓ SẴN (Standard)**<br>Twenty bản gốc tập trung B2B CRM thuần túy, chưa đóng gói sẵn Standard Object `Product` & `Service`. | **Dễ (Easy)**<br>*(Khoảng 1-2 ngày)* | Tạo một Syncable Twenty App hoặc Custom Metadata Object `Product` (`name`, `sku`, `type`, `price`, `durationMinutes`, `stockQuantity`, `images`). Không cần sửa core. |
| **6. Phân hệ Đơn hàng (Orders & Items)** | • Bảng Đơn hàng (Mã OD..., Khách hàng, SĐT, Sản phẩm, Tổng tiền, Giảm giá, Còn lại, Nguồn, Trạng thái) | 🔴 **CHƯA CÓ SẴN (Standard)**<br>Chưa có sẵn bảng `Order` & `OrderItem` quan hệ 1-Nhiều với `Person` và `Product`. | **Dễ - Trung bình**<br>*(Khoảng 2-3 ngày)* | Tạo Twenty App `OrderManagement` định nghĩa Object `Order` + `OrderItem` (Relation Many-to-One tới `Person` và `Product`), tích hợp tính toán tự động qua Logic Function. |
| **7. Quản lý Vấn đề / Khiếu nại (Tickets)** | • Tiếp nhận sự cố, khiếu nại khách hàng<br>• Phân công kỹ thuật/CSKH, SLA | 🟢 **HỆ SINH THÁI ĐÃ CÓ**<br>Crove OS có `desk.crove.com` (AgentDesk fork). Đồng thời có thể tạo Ticket Object trong CRM. | **Dễ (Easy)** | Sync 2 chiều giữa `Crove Desk` và `Crove CRM` qua Webhooks (`organization.ticket_created`). |
| **8. Tự động hóa & Kịch bản (Workflows)** | • Tự động gửi tin nhắn/email khi đổi stage<br>• Tự động tạo task nhắc việc khi khách để lại SĐT |  **ĐÃ CÓ (Vượt trội)**<br>Twenty Workflow Engine hỗ trợ Trigger đa dạng, Filter nhánh, Action Webhook, Send Email, Code Execution. | Rất Dễ (Đã hoàn thiện) | Tận dụng Twenty Workflow Engine nguyên bản. |
| **9. Tích hợp Zalo ZNS & SMS Brandname** | • Kết nối Zalo Cloud API gửi ZNS template<br>• Kết nối eSMS, Vietguys, FPT SMS gửi tin nhắn CSKH/xác nhận đơn/nhắc lịch | 🔴 **CHƯA CÓ TÍCH HỢP BẢN ĐỊA VN**<br>Twenty chỉ có Email (Gmail/Outlook/SMTP). Chưa có Connector Zalo OA / ZNS / eSMS. | **Trung bình (Medium)**<br>*(Khoảng 3-4 ngày)* | Xây dựng Twenty Extension Connector (`packages/twenty-apps` hoặc Logic Function):<br>1. Service `ZaloZnsConnector` (gọi Zalo Cloud API `/v1/template/send`)<br>2. Service `EsmsConnector` (gửi SMS Brandname)<br>3. Đăng ký thành Action trong Workflow Builder. |
| **10. Tích hợp Tổng đài ảo (Call Center / VOIP)** | • Click-to-call trên trình duyệt<br>• Popup thông tin khi có cuộc gọi đến<br>• Lưu lịch sử cuộc gọi, thời lượng, nghe lại file ghi âm | 🟡 **CÓ MỘT PHẦN MODEL**<br>Twenty có entity `callRecording`, nhưng chưa có SIP WebRTC Softphone UI & Connector tới nhà mạng VN (OMICall, Stringee, Voiptalk). | **Trung bình - Khá**<br>*(Khoảng 4-6 ngày)* | 1. Nhúng WebRTC SIP Client (như JsSIP hoặc Stringee Web SDK) vào Frontend qua Front Component/Action.<br>2. Webhook nhận Call Log & Audio URL từ tổng đài đẩy vào `callRecording` entity. |
| **11. Đồng bộ Hội thoại Đa kênh (Social Omni-inbox)** | • Đồng bộ tin nhắn, comment từ Facebook Fanpage, Instagram, Zalo OA, TikTok Shop, WhatsApp vào CRM | 🟡 **CÓ QUA CROVE ECOSYSTEM**<br>• Hệ sinh thái Crove có `Crove Desk` (Livechat) và `Crove Post`<br>• Có thể đẩy lead tự động từ Social về CRM qua Webhook. | **Khá (Medium-High)**<br>*(Tùy phạm vi)* | 1. Tận dụng Webhook từ Meta Graph API / Zalo OA Webhook để tự động tạo `Person` / `Opportunity` qua REST API của Twenty.<br>2. Hoặc kết nối thông qua `Crove Desk`. |
| **12. Sự kiện Chuyển đổi Quảng cáo (Facebook CAPI / TikTok CAPI)** | • Tự động bắn event `Purchase`, `Lead`, `Schedule` về Facebook CAPI và TikTok Events API khi đơn/lịch hẹn hoàn thành | 🔴 **CHƯA CÓ SẴN**<br>Hiện tại phải dùng công cụ ngoài (như Zapier/Make) hoặc code thủ công. | **Dễ - Trung bình**<br>*(Khoảng 2 ngày)* | Viết Logic Function trong Workflow của Twenty: Khi `Order.status = 'COMPLETED'` hoặc `Appointment.status = 'CONFIRMED'`, gọi Meta Graph API `POST /{pixel_id}/events` và TikTok Events API. |
| **13. Báo cáo Thống kê & Phễu Chuyển đổi (Dashboard & Analytics)** | • Báo cáo Doanh thu so sánh cùng kỳ<br>• Báo cáo Doanh thu theo nguồn<br>• Phân tích Khách hàng theo Giới tính, Độ tuổi<br>• Phễu chuyển đổi (Conversion Funnel) | 🟡 **CÓ MỘT PHẦN**<br>Twenty có entity `dashboard`, thống kê bản ghi cơ bản, nhưng chưa có sẵn biểu đồ Phễu chuyên sâu (Funnel Chart) và Demographic chart (Age/Gender). | **Trung bình (Medium)**<br>*(Khoảng 3 ngày)* | Xây dựng các Front Component Dashboard Widgets tùy biến bằng Recharts / Chart.js tích hợp vào màn hình Tổng quan của Crove CRM. |
| **14. Quản lý Chi nhánh (Multi-branch)** | • Phân bổ dữ liệu và phân quyền theo từng cơ sở / chi nhánh của chuỗi | 🟡 **CÓ THỂ CẤU HÌNH**<br>Có thể tạo Object `Branch` và phân quyền qua Row-Level Security / Role Filters của Twenty. | **Dễ (Easy)**<br>*(Khoảng 1 ngày)* | Tạo Object `Branch` và quan hệ 1-Nhiều với `Person`, `Order`, `Appointment`, `WorkspaceMember`. |
| **15. Mẫu ngành (Industry Templates: Spa, Clinic, BĐS...)** | • Khởi tạo sẵn các trường dữ liệu và quy trình chuẩn cho từng ngành | 🔴 **CHƯA CÓ TEMPLATE PICKER**<br>User hiện phải tự tạo các trường custom. | **Dễ (Easy)**<br>*(Khoảng 2 ngày)* | Xây dựng các Workspace Preset / Twenty App Packages mẫu (Ví dụ: `app-spa-beauty`, `app-clinic-medical`, `app-education`) tự động cài đặt schema khi khởi tạo workspace. |

---

## 5. Đánh giá Khả thi Kỹ thuật & Nguyên tắc "Fork Minimal Modification"

Theo nguyên tắc kiến trúc cốt lõi của **Crove CRM**:
1. **Tuyệt đối không sửa đè core Twenty CRM (`twenty-server`, `twenty-front`)**:
   - Tất cả các đối tượng mới như `Product`, `Order`, `OrderItem`, `Appointment`, `Branch` được triển khai dưới dạng **Twenty Apps (Extensions)** hoặc **Metadata Syncable Entities**.
   - Không gây xung đột mã nguồn (merge conflicts) khi kéo cập nhật mới từ `upstream/main` của Twenty.
2. **Triển khai Tích hợp theo Cơ chế Plug-and-Play**:
   - Các cổng tích hợp bản địa Việt Nam (Zalo ZNS, eSMS, Stringee/OMICall, Facebook CAPI) được đóng gói thành các **Logic Functions** và **Micro-services / Webhook Handlers**.
   - Tận dụng hệ thống BullMQ Worker và Redis sẵn có của Crove CRM để xử lý gửi tin nhắn, webhooks và CAPI bất đồng bộ đảm bảo tốc độ phản hồi < 100ms.

---

## 6. Lộ trình Triển khai Đề xuất (Next Dev Roadmap)

### Giai đoạn 1: Bán hàng cốt lõi & Quản lý Sản phẩm / Đơn hàng (Core Commerce Extension)
* **Mục tiêu**: Bổ sung đầy đủ năng lực quản lý Sản phẩm (kèm SKU, Giá, Thời lượng dịch vụ) và Đơn hàng (kèm giỏ hàng, thanh toán, trạng thái).
* **Phạm vi kỹ thuật**:
  - Tạo Twenty App `crove-sales-suite` chứa 2 Object: `Product` và `Order` + `OrderItem`.
  - Thiết lập mối quan hệ N-1 với `Person` (Khách hàng) và `WorkspaceMember` (Nhân viên phụ trách).
  - Tự động tính toán tổng tiền, chiết khấu và công nợ còn lại.

### Giai đoạn 2: Tích hợp Giao tiếp Bản địa Việt Nam (Zalo ZNS & SMS Gateway)
* **Mục tiêu**: Tự động gửi tin nhắn xác nhận đơn, nhắc lịch hẹn và chăm sóc khách hàng qua Zalo ZNS và SMS Brandname.
* **Phạm vi kỹ thuật**:
  - Xây dựng connector Zalo Cloud API và eSMS API.
  - Tích hợp vào Action của Twenty Workflow Engine để người dùng kéo thả thiết lập kịch bản tự động khi chuyển đổi trạng thái đơn hàng / lịch hẹn.

### Giai đoạn 3: Báo trùng Số điện thoại & Báo cáo Phễu Nâng cao (Deduplication & Advanced Analytics)
* **Mục tiêu**: Tránh trùng lặp lead giữa các sales và cung cấp dashboard trực quan về doanh thu cùng kỳ, phễu chuyển đổi, nhân khẩu học.
* **Phạm vi kỹ thuật**:
  - Thêm Phone Collision Interceptor trên UI khi thêm mới/chỉnh sửa Contact.
  - Xây dựng Dashboard Widget Canvas: Funnel Chart, Doanh thu so sánh kỳ trước (Line chart), Phân bổ nguồn (Pie chart).

### Giai đoạn 4: Tích hợp CAPI Quảng cáo & Tổng đài VOIP (Call Center & Ads CAPI)
* **Mục tiêu**: Tối ưu chi phí quảng cáo Facebook/TikTok và hỗ trợ telesales bấm gọi trực tiếp trên CRM có lưu ghi âm.
* **Phạm vi kỹ thuật**:
  - Tích hợp Meta Conversions API & TikTok Events API vào event hoàn thành đơn/chốt hẹn.
  - Tích hợp WebRTC SIP Phone hoặc Webhook tổng đài ảo đẩy file ghi âm vào `callRecording`.
