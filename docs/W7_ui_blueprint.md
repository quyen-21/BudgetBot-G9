# 🎨 AI Money Coach - Giao diện & Trải nghiệm (UI/UX & Business Logic Blueprint)

Tài liệu này định hình ngôn ngữ thẩm mỹ, bố cục giao diện Dashboard và cách ánh xạ trực quan giữa **Nghiệp vụ (Business Logic)** và **Trực quan hóa giao diện (UX/UI)** của ứng dụng AI Money Coach.

---

## 1. Hệ màu & Thẩm mỹ chủ đạo (Theme & Palette)
Ứng dụng tuân theo ngôn ngữ thiết kế **FinTech Premium** kết hợp phong cách **Glassmorphism** (kính mờ) hiện đại, tạo cảm giác tin cậy và công nghệ cao:

*   **Tông màu nền (Background):** Premium Emerald Black (`#071713`) - Xanh ngọc lục bảo tối sâu, giảm mỏi mắt và tăng tính sang trọng.
*   **Hộp vật thể (Cards):** Xanh Forest Green (`#0d231d`) mờ đục 80%, viền nét mảnh màu kem mờ `rgba(241, 232, 214, 0.13)` và hiệu ứng bo góc 16px.
*   **Màu nhấn phát sáng (Glow/Neon Accents):**
    *   `#68e3ae` (Xanh Mint): Biểu thị giao dịch khớp luật an toàn (`Rule-matched`), ngân sách dư dả.
    *   `#80bffc` (Xanh Royal Blue): Biểu thị giao dịch do AI phân loại (`AI-classified`).
    *   `#efbd69` (Vàng Gold): Cảnh báo ngân sách chạm ngưỡng hoặc giao dịch cần người dùng duyệt (`NEEDS_REVIEW`).
    *   `#f07c63` (Đỏ Salmon): Ngân sách vượt hạn mức (Vượt Cap).

---

## 2. Bố cục Tổng quan trang Dashboard (Layout Structure)

Giao diện sử dụng bố cục **3 Cột tối ưu hóa thông tin** trên một màn hình duy nhất để tránh người dùng phải cuộn trang nhiều:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  AI Money Coach   [ Kéo thả sao kê CSV vào đây ] 🗂️            🔔 Thông báo   👤 Tài khoản │
├───────────────┬──────────────────────┬──────────────────────┬──────────────────────────┤
│ 🧭 Overview   │ 📑 GIAO DỊCH GẦN ĐÂY  │ 📊 PHÂN TỔ CHỈ TIÊU   │ 🤖 TRỢ LÝ AI COACH       │
│               │                      │                      │                          │
│ 📥 Review (5) │ [ Grab ]             │   ┌──────────────┐   │ "Chào bạn, tuần này chi  │
│               │ 🏷️ Rule   - $10.00   │  /    Food 40%    \  │ tiêu danh mục Food của   │
│ ⚙️ Smart Rules│                      │ |  Shopping 35%   | │ bạn đang chạm ngưỡng 85%.│
│               │ [ Vinmart ]          │  \   Others 25%   /  │ Gợi ý: Hạn chế ăn ngoài  │
│ 💳 Budgets    │ 🏷️ AI     - $25.00   │   └──────────────┘   │ cuối tuần này nhé!"      │
│               │                      │                      │                          │
│ 📈 Insights   │ [ Merchant X ]       │ HẠN MỨC NGÂN SÁCH    │   [ Hỏi AI điều gì... ]  │
│               │ 🏷️ Review - $50.00   │ ■ Food [=====>--] 85%│                          │
└───────────────┴──────────────────────┴──────────────────────┴──────────────────────────┘
```

---

## 3. Bản ánh xạ: Nghiệp vụ (Business) và UX/UI (Design) tương ứng

| Quy trình Nghiệp vụ (Business Logic) | Giải pháp UX/UI tương ứng (Design Solution) | Cách thiết kế này hoạt động trong app của bạn | Dẫn chứng từ các App đạt giải thế giới |
| :--- | :--- | :--- | :--- |
| **1. Nghiệp vụ Tối ưu hóa chi phí (Cost ROI):**<br>Chạy qua Regex/Rules trước để lọc 60% giao dịch lặp lại với chi phí 0đ; chỉ gửi 40% giao dịch lạ lên LLM để tiết kiệm API. | **Trạng thái minh bạch (Transparency Status Badge):**<br>Hiển thị rõ nguồn gốc phân loại của từng giao dịch. | Bên cạnh mỗi giao dịch đã phân loại, có một nhãn nhỏ (Badge):<br>• `Rule-matched` (Màu xanh mint)<br>• `AI-classified` (Màu xanh dương)<br>• `User-corrected` (Màu tím). | **Monarch Money** sử dụng các icon nguồn dữ liệu rõ ràng để người dùng biết giao dịch nào tự động kết nối, giao dịch nào do Rule xử lý. |
| **2. Nghiệp vụ An toàn AI (AI Safety):**<br>Giao dịch có điểm tự tin (confidence score) `< 0.8` hoặc AI phân loại lỗi sẽ bị gán trạng thái `NEEDS_REVIEW` để con người duyệt lại. | **Hàng chờ kiểm duyệt một chạm (Review Queue UX):**<br>Tách biệt các giao dịch nghi ngờ ra một khu vực riêng với tương tác nhanh. | Thiết kế một Tab riêng biệt mang tên **"Review Queue"** với số đếm màu đỏ (như thông báo tin nhắn chưa đọc). <br>Tại đây, người dùng duyệt nhanh danh mục gợi ý bằng 1 cú click (Approve) hoặc đổi danh mục qua một dropdown đơn giản. | **Copilot Money (Apple Design Award)** sử dụng giao diện thẻ vuốt (swipe cards). Vuốt phải để duyệt, vuốt trái để sửa danh mục, tối ưu hóa triệt để thao tác của con người. |
| **3. Nghiệp vụ Học máy thích ứng (Adaptive Learning):**<br>Khi người dùng sửa danh mục ở Review Queue, backend ghi nhận và sinh ra một learned rule mới để tự động hóa kỳ sau. | **Công tắc ghi nhớ (Remember Switch) & Trang Quản lý Rule:**<br>Để người dùng kiểm soát và biết AI đang "học hỏi" từ họ. | Khi người dùng đổi danh mục của một giao dịch, một công tắc **"Ghi nhớ luật này cho các lần sau"** tự động sáng lên.<br>Thiết lập một trang **"Smart Rules"** liệt kê các luật AI đã học dưới dạng thẻ trực quan để người dùng có thể xóa/sửa khi cần. | **EveryDollar** và **Copilot** cho phép người dùng quản lý danh sách các "Merchant Rules" đã tạo một cách cực kỳ tường minh trong trang Settings. |
| **4. Nghiệp vụ Thắt chặt Ngân sách (Budgeting Cap):**<br>AI Money Coach giám sát hạn mức chi tiêu của từng danh mục và đưa ra cảnh báo khi người dùng sắp chi tiêu vượt ngưỡng. | **Thanh tiến trình cảnh báo đổi màu (Dynamic Progress Bar):**<br>Tín hiệu thị giác mạnh mẽ để cảnh báo hành vi tiêu dùng. | Thanh tiến trình hiển thị ngân sách còn lại sẽ tự động thay đổi màu sắc dựa trên tỷ lệ đã tiêu:<br>• Dưới 70%: Màu xanh mint dịu mắt.<br>• 70% - 90%: Chuyển sang màu vàng neon cảnh báo.<br>• Trên 90%: Đỏ rực rỡ báo hiệu dừng lại. | **Apple Card (Webby Winner)** đổi màu sắc của toàn bộ biểu đồ chi tiêu và giao diện thẻ Wallet sang màu đỏ/cam đậm khi người dùng tiêu quá tay ở danh mục đó. |
| **5. Nghiệp vụ Lời khuyên tài chính (AI Advice/Coach):**<br>AI phân tích tệp CSV và đưa ra các insights cá nhân hóa về thói quen chi tiêu. | **Góc AI Coach (Glassmorphism Assistant Card):**<br>Trực quan hóa lời khuyên của AI dưới dạng một trợ lý thân thiện. | Thiết kế một thẻ Trợ lý AI ở đầu trang Dashboard với giao diện kính mờ (Glassmorphism) sang trọng. Lời khuyên của AI được chia làm 3 mục rõ ràng bằng các biểu tượng cảm xúc (Emoji):<br>• 📉 *Xu hướng giảm chi tiêu*<br>• ⚠️ *Cảnh báo vượt hạn mức*<br>• 💡 *Gợi ý tiết kiệm*. | **Cleo** trực quan hóa Trợ lý AI thành một chatbot có cá tính riêng biệt, giao tiếp bằng ngôn từ trẻ trung thay vì các bảng số liệu khô khan. |

---

## 4. Luồng trải nghiệm người dùng thực tế (Flow Walkthrough)

### 🚀 Bước 1: Tải lên Sao kê (CSV Upload Flow)
1.  Người dùng kéo thả file `.csv` vào vùng nét đứt ở Header.
2.  Hiệu ứng UI: Vùng kéo thả phát sáng xanh mint, hiển thị hiệu ứng Loading AI đang quét.
3.  **Nghiệp vụ Backend:** Hệ thống parse file, chạy Regex trước, gọi Bedrock Claude 3.5 Haiku sau cho các dòng lạ.

### 📥 Bước 2: Phê duyệt một chạm (Review Queue Flow)
1.  Người dùng nhấn vào tab **Review Queue**.
2.  Giao diện chỉ hiển thị 5 giao dịch có điểm confidence thấp.
3.  **Thiết kế tương tác:**
    *   Mỗi giao dịch hiển thị danh mục AI đề xuất mờ (ví dụ: `Food (Độ tự tin: 55%)`).
    *   Bên cạnh có nút **`Đồng ý`** (Tích xanh) và **`Thay đổi`** (Dropdown chọn danh mục khác).
    *   Dưới nút thay đổi có một Checkbox phát sáng: **`Ghi nhớ cho các lần sao kê sau`** (Nhằm kích hoạt nghiệp vụ *Dynamic Rule Learning*).
4.  Khi người dùng click duyệt hết 5 giao dịch, màn hình hiển thị hiệu ứng pháo hoa nhẹ kèm chữ **`Inbox Zero! Tài chính của bạn đã an toàn.`**.

### 📊 Bước 3: Cập nhật chỉ số trong Real-time
*   Ngay khi một giao dịch được duyệt từ Review Queue, hệ thống tự động tính toán lại, biểu đồ Donut và các thanh tiến trình ngân sách (Progress Bars) tự động trượt cập nhật số liệu mới (micro-animation mượt mà), đem lại cảm giác ứng dụng vô cùng sống động và nhạy bén.
