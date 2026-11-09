# UI/UX --- TÂM AN v2.0

## 1. Ngôn ngữ thiết kế

-   Không gian cổ kính, trang nghiêm, ấm áp.
-   Gỗ, đá, giấy dó, đồng, ánh sáng đèn lồng và khói nhang 3D mỏng, cuộn
    nhẹ lên sau thao tác thắp nhang.
-   Tránh hiệu ứng kinh dị, phô trương hoặc quá nhiều particle.
-   Không giả danh một ngôi chùa/đền cụ thể.
-   Font dễ đọc, hỗ trợ đầy đủ tiếng Việt.

## 2. Sitemap

``` text
/
├── /experience
│   ├── Gate
│   ├── Main Hall
│   ├── Courtyard
│   └── Rooms (scene state)
│       ├── Xin Xăm
│       ├── Âm Dương
│       ├── Kinh Dịch
│       ├── Quẻ Đầu Ngày
│       ├── Tình Duyên
│       └── Công Danh
├── /history
├── /about
├── /sources
├── /privacy
└── /admin
    ├── /rooms
    ├── /fortune-systems
    ├── /fortunes
    └── /assets
```

## 3. Luồng trải nghiệm

1.  Cổng Tam Quan: bắt đầu.
2.  Chính điện: người dùng chạm lần lượt vào ba cây nhang 3D; mỗi cây bay
    vào lư hương, cắm xuống và tạo khói. Nghi thức có thể bỏ qua.
3.  Sân trung tâm: sáu khu vực xuất hiện.
4.  Nhấn khu vực: chuyển thẳng vào phòng 3D.
5.  Thực hiện nghi thức hoặc đọc nội dung.
6.  Xem kết quả.
7.  Quay về sân trung tâm hoặc kết thúc.

Không có màn hình giới thiệu phòng trước khi vào. Không bắt buộc phải đi
đủ sáu khu vực.

Không yêu cầu đăng ký hoặc đăng nhập ở bất kỳ bước nào của trải nghiệm
công khai.

## 4. Sân trung tâm

-   Đây là hub 3D sau Chính điện.
-   Sáu điện được bố trí quanh sân theo kiến trúc cân đối, có lối đi rõ.
-   Mỗi điện có biển tên hoặc ký hiệu đọc được.
-   Mỗi điện là một hotspot tương tác.
-   Hover desktop: highlight nhẹ, hiện tên điện.
-   Tap mobile: click trực tiếp và chuyển cảnh ngay.
-   Không hiện modal, popup, tooltip bắt buộc xác nhận hoặc nút "Vào
    phòng".
-   Có thể dùng label nổi nhỏ luôn hiển thị để người dùng nhận biết khu
    vực.
-   Không yêu cầu camera tự do; camera có thể giới hạn để tránh người
    dùng lạc.

## 5. Chuyển thẳng vào phòng

-   Khi click hotspot, khóa click lặp trong lúc chuyển cảnh.
-   Fade-out khoảng ngắn hoặc camera travel mượt.
-   Load scene tương ứng.
-   Đặt camera ở điểm nhìn bắt đầu bên trong phòng.
-   Fade-in và hiển thị UI nghi thức.
-   Không hiện màn hình trung gian mang nội dung giới thiệu.
-   Nếu load chậm, dùng overlay loading tối giản trên chính chuyển cảnh,
    không phải trang giới thiệu.
-   Khi load lỗi: nút thử lại, về sân, hoặc dùng 2D.

## 6. Sáu phòng

### 6.1 Điện Xin Xăm

-   Ống xăm đặt ở trung tâm.
-   Có bàn/đế đặt ống xăm và khu vực hiển thị thẻ.
-   Người dùng chạm trực tiếp vào ống xăm 3D; ống lắc rồi một que/thẻ
    rơi ra.
-   Thẻ bay/phóng lớn vào giữa màn hình để người dùng tập trung vào số
    demo; có thể đóng thẻ để trở lại nội thất.
-   Không đặt bảng thông tin lớn che nội thất; giữ chỉ dẫn ngắn gọn và
    nút về sân.
-   Không khuyến khích xin liên tục để tìm kết quả mong muốn.

### 6.2 Điện Âm Dương

-   Hai đồng xu/đồng gieo trên mặt bàn.
-   Chạm trực tiếp vào đồng xu để bắt đầu mô phỏng; đồng xu lật và dừng
    theo kết quả từ máy chủ.
-   Hiển thị kết quả trong thẻ tập trung ở giữa màn hình.
-   Có nút về sân.

### 6.3 Điện Kinh Dịch

-   Không gian bàn gieo quẻ, sáu hào được dựng rõ từ dưới lên.
-   Chạm trực tiếp vào sáu hào để tạo mô phỏng; kết quả khớp dữ liệu
    máy chủ.
-   Hiển thị sáu hào và hào động (nếu có) trong thẻ giữa màn hình.
-   Có nút về sân.

### 6.4 Điện Quẻ Đầu Ngày

-   Một khu vực ánh sáng buổi sớm.
-   Chạm biểu tượng mặt trời để mở gợi ý trong ngày ở giữa màn hình.
-   Ghi rõ đây là nội dung chung trong ngày nếu áp dụng cùng một quẻ cho
    tất cả.

### 6.5 Điện Tình Duyên

-   Không gian ấm, nhẹ, tránh sến hoặc khẳng định định mệnh.
-   Chạm vòng đôi để mở một câu hỏi tự phản tư về giao tiếp, tôn trọng,
    ranh giới và vun đắp.
-   Không phán đoán cảm xúc hoặc hành vi của người thứ ba.

### 6.6 Điện Công Danh

-   Không gian thư phòng/trang sách/calligraphy.
-   Chạm cuộn thư để mở một câu hỏi tự phản tư về công việc và định hướng.
-   Không cam kết thành công hoặc đưa ra lời khuyên đầu tư.

-   Các phòng dùng chỉ dẫn ngắn thay cho bảng điều khiển che mô hình.
    Kết quả demo mở ở giữa màn hình và có thể đóng để quay lại nội thất.
-   Cả sáu điện dùng Gemini để tạo lời luận giải và câu hỏi tự chiêm nghiệm
    dựa trên kết quả nghi thức; trên thẻ chỉ dùng nhãn "Luận giải". Kết quả
    gieo vẫn do mô phỏng phía máy chủ tạo, không bị thay đổi. Không trình
    bày nội dung như dự đoán chắc chắn hoặc tư liệu truyền thống đã xác minh.

## 7. Kết quả

-   Tên hệ thống và phương pháp.
-   Kết quả chính.
-   Nguyên văn (nếu có).
-   Diễn giải hiện đại.
-   Lời khuyên chiêm nghiệm.
-   Nguồn và ghi chú biên tập.
-   Disclaimer.
-   Nút về sân trung tâm.
-   Người dùng không cần đăng nhập. Nếu bật lưu lịch sử, chỉ lưu trên
    thiết bị hiện tại sau khi được người dùng đồng ý; không đồng bộ qua
    thiết bị khác.

## 8. Responsive và accessibility

-   Mobile-first; hotspot đủ lớn để chạm.
-   Có label không phụ thuộc hover.
-   Có nút điều hướng 2D thay thế.
-   Hỗ trợ bàn phím cho UI và navigation.
-   Tôn trọng `prefers-reduced-motion`.
-   Âm thanh hiệu ứng tắt mặc định, không tự phát.
-   Có điều khiển bật/tắt âm thanh cho tiếng gõ/lắc nhẹ và hiệu ứng hiện kết quả.
-   Có fallback 2D cho mọi nghi thức cốt lõi.

## 9. UI states

-   Loading scene.
-   Scene load error.
-   API pending.
-   API error + retry.
-   Empty content.
-   No history.
-   Offline.
-   Reduced-motion.
-   WebGL unsupported.

Không giả lập kết quả thành công nếu server lỗi.
