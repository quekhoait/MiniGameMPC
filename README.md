# MINI GAME MPC – BỘ 3 TRÒ CHƠI SỰ KIỆN & LIVESTREAM

Hệ thống mini-game tương tác thời gian thực được xây dựng bằng **ReactJS + Vite + Tailwind CSS + Three.js + HTML5 Canvas (60 FPS)**.

---

## 🎮 MENU LỰA CHỌN 3 TRÒ CHƠI

1. ⚔️ **FOX BATTLE ROYALE (Đại Chiến Cáo Bay)**
   - Sảnh chờ tùy chỉnh thời gian (3s - 60s) với nhạc nền MP3 tự động giảm dần trong 3s cuối.
   - Hiệu ứng làm mờ và đếm ngược 3D chuyển sang chiến trường.
   - 400 chú cáo bay bắn tia laser và né đạn ngẫu nhiên.
   - Khi còn dưới 150 con: tự động tăng tốc độ bay và tần suất ra đạn.
   - Cơ chế dọn dẹp bộ nhớ tự động sau mỗi 30 con bị hạ gục.
   - Màn đối đầu 1v1 mượt mà và kết thúc chốt duy nhất 1 Quán Quân ở 0.2s cuối cùng.
   - Bảng vàng vinh danh **Top 5 người sống sót cuối cùng**.

2. 🏁 **FOX RACE (Cuộc Đua Cáo Bay 10s)**
   - 400 chú cáo dàn trải dọc theo bố cục tổ ong đẹp mắt ở góc 1/4 bên trái đường đua.
   - Vạch Xuất Phát và vạch Đích rõ nét.
   - Đếm ngược toàn màn hình **3 – 2 – 1 – GO!** kèm âm thanh xuất phát.
   - Camera 3D theo dõi linh hoạt theo nhóm cáo dẫn đầu.
   - Cuộc đua kéo dài chính xác 10.0 giây, công bố **Bảng vàng Top 10 về đích** kèm quãng đường.

3. 🎰 **LOTTERY BALL 3D (Hệ Thống Quay Lồng Cầu MSSV)**
   - Lồng cầu 3D Three.js mô phỏng chân thực: vỏ kính acrylic trong suốt, khung kim loại vàng bóng, trục quay và chân đế chịu lực.
   - 400 quả cầu 3D với màu sắc đa dạng, chuyển động nhào lộn, va chạm và nảy tự nhiên trong lồng cầu ở 60 FPS.
   - **4 giai đoạn quay lồng**:
     - *Khởi động*: Động cơ tăng tốc dần, tiếng máy quay và tiếng bóng va chạm.
     - *Quay mạnh*: Lồng quay tít, các quả cầu chuyển động hỗn loạn.
     - *Giảm tốc*: Giảm tốc độ mượt mà khi bấm Dừng / Chọn bóng.
     - *Lấy bóng*: Quả cầu trúng thưởng chạy qua ống hút trong suốt, lăn xuống khay và bay phóng to về phía camera.
   - Thuật toán chọn bóng ngẫu nhiên công bằng, không lặp lại sinh viên đã trúng trong cùng phiên.
   - Cấu hình số người trúng: 1, 3, 5, 10 hoặc tự động quay liên tục.
   - Nhập danh sách MSSV bằng cách dán text, tạo mẫu nhanh hoặc tải file Excel (`.xlsx`, `.xls`, `.csv`).
   - Bảng lịch sử trúng giải với bộ lọc tìm kiếm và chức năng xuất file CSV chuẩn tiếng Việt.
   - Lưu trữ tự động trong `LocalStorage`.

---

## 🚀 CÀI ĐẶT & CHẠY ỨNG DỤNG

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 18+ hoặc 20+)
- Trình duyệt hiện đại hỗ trợ WebGL 2.0 (Chrome, Edge, Firefox, Brave)

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173/`

### 4. Đóng gói bản phát hành (Production Build)
```bash
npm run build
```

---

## 🖥️ HỖ TRỢ TRÌNH CHIẾU TOÀN MÀN HÌNH (LIVESTREAM)

- Bấm biểu tượng **Toàn màn hình** ở góc trên bên phải thanh Menu (hoặc bấm `F11` trên bàn phím).
- Giao diện được tối ưu với thanh điều khiển mỏng nổi, ẩn các thanh công cụ không cần thiết để phục vụ trình chiếu trên màn hình LED sự kiện hoặc livestream.
