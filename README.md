# TÂM AN

Prototype Next.js/TypeScript cho trải nghiệm không gian văn hóa và chiêm nghiệm 3D. Ứng dụng không yêu cầu đăng nhập; mô hình hiện được dựng bằng hình khối procedural, không đại diện cho một địa điểm có thật.

## Chạy ứng dụng

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`. Dùng `pnpm typecheck`, `pnpm lint` và `pnpm build` để kiểm tra mã.

### Cấu hình Gemini miễn phí

Tạo API key trong [Google AI Studio](https://aistudio.google.com/apikey), sao chép
`.env.example` thành `.env.local`, rồi điền `GEMINI_API_KEY`. Khởi động lại
`pnpm dev` sau khi thêm key. Key chỉ được dùng trong API server, không đưa vào
client hoặc commit lên git. Gemini Free Tier có hạn mức thay đổi theo tài khoản
và model; Google có thể dùng dữ liệu gửi tới Free Tier để cải thiện sản phẩm.
Không nhập thông tin cá nhân nhạy cảm vào trải nghiệm.

## Tính năng hiện có

- Hành trình qua Cổng Tam Quan, Chính điện và Sân trung tâm; có thể bỏ qua thắp nhang mô phỏng.
- Sáu phòng 3D tương tác, với kiến trúc đền procedural có mái cong nhiều lớp, cột, bệ và nội thất; kéo để xoay góc nhìn hoặc chọn phòng từ danh sách.
- Ống xăm 3D được hoàn thiện thêm chi tiết sơn son, viền đồng, miệng ống mở và bó thẻ xăm chuyển động khi chạm.
- Hiệu ứng âm thanh tạo tại chỗ cho tiếng lắc ống/thẻ rơi và các nghi thức; tắt mặc định, người dùng bật/tắt ở thanh trên.
- Sáu điện gọi `POST /api/ai/interpretation` để Gemini tạo luận giải và câu hỏi tự phản tư từ nghi thức/kết quả của điện. Xin Xăm, Âm Dương và Kinh Dịch vẫn tạo kết quả mô phỏng riêng ở server; AI không thay đổi kết quả gieo.
- Xin Xăm demo: chạm trực tiếp vào ống xăm 3D để lắc; que rơi ra rồi thẻ phóng lớn vào giữa màn hình. Server chọn số ngẫu nhiên 1–100 tại `POST /api/demo/fortune-draw`; nội dung luận giải do AI sáng tác, không phải lời xăm thật.
- Âm Dương demo: hai mặt xu ngẫu nhiên tại `POST /api/demo/ritual`, sau đó AI diễn giải như gợi ý hiện đại.
- Kinh Dịch demo: quy ước ba đồng xu tạo sáu hào từ dưới lên; AI chỉ tạo lời gợi mở hiện đại, không phải tên quẻ hoặc lời giải cổ truyền đã xác minh.
- Quẻ đầu ngày dùng câu hỏi chiêm nghiệm chung theo ngày `Asia/Ho_Chi_Minh`, rồi AI tạo phần luận giải; không cá nhân hóa.
- Tình Duyên và Công Danh dùng AI tạo câu hỏi tự phản tư, không phán đoán tương lai hay người khác.
- Lịch sử chỉ lưu khi người dùng chủ động bật và chọn lưu; dữ liệu nằm trong trình duyệt trên thiết bị hiện tại, có thể xem, xóa từng mục, xóa hết hoặc tắt lưu.
- Có trang [giới thiệu](./src/app/about/page.tsx), [nguồn nội dung](./src/app/sources/page.tsx), [quyền riêng tư](./src/app/privacy/page.tsx) và [lịch sử trên thiết bị](./src/app/history/page.tsx).

Các API demo không lưu kết quả trên máy chủ. Khi dùng Gemini Free Tier, nội dung nghi thức gửi tới Google và có thể được dùng để cải thiện sản phẩm theo điều khoản gói miễn phí; ứng dụng không gửi tên hay thông tin liên hệ. Kết quả và gợi ý AI được ghi nhãn là nội dung mô phỏng/chiêm nghiệm, không phải dự đoán, tư vấn chuyên môn hay tư liệu quẻ đã xác minh. Hiện chưa tích hợp cơ sở dữ liệu production hoặc asset GLB có giấy phép đã kiểm tra.

Khi WebGL không khả dụng hoặc khởi tạo thất bại, ứng dụng giữ lại các điều khiển HTML để chọn phòng và dùng các mô phỏng; mô hình 3D được thay bằng thông báo fallback. Các điện hiện dùng hình khối procedural, chưa phải mô hình kiến trúc scan/GLB của di tích thật.
