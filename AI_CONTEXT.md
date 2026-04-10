# TCT SCANNER PRO - PROJECT CONTEXT FOR AI (V1.2.2.1 Diamond Cloud)

Tài liệu này lưu trữ toàn bộ ngữ cảnh, logic và các quyết định kỹ thuật quan trọng của dự án để AI có thể tiếp tục hỗ trợ ngay lập tức khi được tải lên.

## 1. Thông tin chung
- **Tên dự án**: TCT Scanner Pro (Diamond Edition).
- **Mục đích**: Quản lý đơn hàng Shopee, quét mã QR, đồng bộ Firebase (Cloud), giám sát Camera và ghi hình bằng chứng.
- **Phiên bản hiện tại**: V1.2.2.1 Diamond Cloud (Cập nhật 10/04/2026).
- **Công nghệ**: HTML5, Vanilla CSS, Javascript (ES6), Firebase Realtime Database, go2rtc.

## 2. Logic Xử lý Dữ liệu (Dữ liệu Tab)
- **Định dạng thời gian**: Bắt buộc dùng `DD/MM/YYYY HH:mm:ss` (ví dụ: `04/04/2026 18:48:44`).
- **Máy quét (Scanner Logic - V1.2.2.1)**:
    - **Quét từng mã (Single)**: Dừng máy quét ngay sau khi quét thành công hoặc phát hiện trùng.
    - **Xử lý trùng mã**: Khi phát hiện mã đã tồn tại, dừng camera ngay lập tức. Sau khi người dùng chọn (Ghi đè/Bản sao/Bỏ qua), máy quét GIỮ trạng thái dừng ("Chờ bấm nút") để tránh quét nhầm.
- **Dữ liệu Cloud (Firebase)**:
    - Đồng bộ thời gian thực qua Firebase API.
    - Hỗ trợ lưu trữ lịch sử lớn (> 100 đơn) ổn định.
- **Tìm kiếm & Gợi ý**:
    - Chỉ hiển thị gợi ý khi từ khóa **>= 3 ký tự**.
    - Hiển thị gợi ý **ngay lập tức** từ cache cục bộ khi đủ độ dài.
    - Tìm kiếm rà soát Cloud với debounce 0.8s.

## 3. Hệ thống Camera & Recording (PC Mode)
- **PC Mode**: Giao diện 2 cột (Trái: Quét mã & Lịch sử nhanh | Phải: Giám sát 2 góc & Ghi hình).
- **Camera IP**: Kết nối qua `go2rtc` (WebRTC).
- **Ghi hình**: Sử dụng MediaRecorder, lưu song song 2 góc (CAM1, CAM2) dạng `.webm`.
- **Lưu trữ Video**: Đồng bộ Video lên Google Drive (theo từng mảnh 2MB).

## 4. Bảo mật & Kích hoạt
- **Activation Key**: `310824` (Lưu trạng thái kích hoạt vào localStorage).
- **Mật khẩu Quản trị Database**: `310824`.

## 5. Quy tắc Phát triển (Lưu ý cho AI)
- Luôn giữ giao diện theo phong cách **Diamond Edition** (Tím đậm, Vàng Gold, Hiệu ứng Glassmorphism).
- Khi sửa log, phải cập nhật đồng thời ở `index.html` (template changelog) và `CHANGELOG.md`.
- Bảo toàn logic `formatDate` và `parseDate` đã xây dựng trong `app.js`.
- **Lưu ý V1.2.2.1**: Logic máy quét đã được tinh chỉnh để không tự động bật lại sau khi xử lý trùng mã.

---
*File updated on 2026-04-10 by Antigravity AI (Scanner Fix V1.2.2.1).*
