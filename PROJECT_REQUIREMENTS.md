# PROJECT REQUIREMENTS --- TÂM AN v2.0

## 1. Tổng quan

TÂM AN là website public mô phỏng một không gian nghi thức văn hóa --
tâm linh. Người dùng thắp nhang mô phỏng tại Chính điện, sau đó tự do
khám phá sáu khu vực trong khuôn viên. Mỗi khu vực là một phòng 3D riêng
có tương tác và nội dung riêng.

### Mục tiêu

-   Tạo trải nghiệm khám phá không gian 3D có tính trang nghiêm.
-   Tái hiện một số nghi thức ở mức mô phỏng tương tác.
-   Cung cấp nội dung quẻ có nguồn, có ghi chú biên tập.
-   Dùng được trên desktop và mobile, kể cả thiết bị không hỗ trợ WebGL
    tốt.

### Đối tượng

Công chúng quan tâm đến văn hóa, nghi thức truyền thống và hoạt động
chiêm nghiệm. Không nhắm đến việc khai thác nỗi sợ hoặc sự lệ thuộc tâm
linh.

## 2. Luồng sản phẩm đã chốt

``` mermaid
flowchart TD
  A[Cổng Tam Quan] --> B[Chính điện]
  B --> C[Thắp nhang mô phỏng]
  C --> D[Sân trung tâm]
  D --> E[Điện Xin Xăm]
  D --> F[Điện Âm Dương]
  D --> G[Điện Kinh Dịch]
  D --> H[Điện Quẻ Đầu Ngày]
  D --> I[Điện Tình Duyên]
  D --> J[Điện Công Danh]
  E --> K[Thực hiện nghi thức và xem kết quả]
  F --> K
  G --> K
  H --> K
  I --> K
  J --> K
  K --> D
```

### Quy tắc điều hướng bắt buộc

-   Sau khi hoàn tất hoặc bỏ qua bước thắp nhang, người dùng đến Sân
    trung tâm.
-   Sân trung tâm có sáu khu vực tương tác.
-   Khi nhấn vào một khu vực, chuyển thẳng vào phòng 3D tương ứng.
-   **Không hiển thị popup giới thiệu, modal xác nhận, trang chi tiết
    trung gian hoặc bước chọn "vào phòng".**
-   Chuyển cảnh có thể dùng fade ngắn hoặc camera travel; sau chuyển
    cảnh người dùng đã ở bên trong phòng.
-   Trong mỗi phòng luôn có nút "Về sân trung tâm".
-   Không bắt buộc đi theo thứ tự; người dùng có thể vào bất kỳ phòng
    nào và quay lại bất cứ lúc nào.
-   Nếu scene lỗi/tải thất bại, hiện lỗi tại chỗ và nút thử lại hoặc
    chuyển sang 2D.

## 3. Sáu khu vực

### 3.1 Điện Xin Xăm

-   Ống xăm gồm 100 thẻ, đánh số thứ tự.
-   Người dùng thao tác lắc/xóc ống xăm.
-   Trong prototype, người dùng chạm trực tiếp vào ống xăm 3D; ống lắc,
    que/thẻ demo rơi ra rồi hiện ở giữa màn hình.
-   Server chọn một thẻ trong bộ 100 thẻ đang được xuất bản.
-   Scene thể hiện thẻ được chọn rơi/được rút ra.
-   Hiển thị số xăm, tiêu đề, nguyên văn (nếu có), diễn giải, lời khuyên
    và nguồn.
-   Nội dung đủ 100 thẻ phải được biên tập/kiểm chứng trước khi công bố
    tính năng đầy đủ.

### 3.2 Điện Gieo Quẻ Âm Dương

-   Có hai đồng xu/đồng gieo được mô phỏng bằng 3D.
-   Người dùng thực hiện thao tác gieo.
-   Hệ thống xác định kết quả theo quy tắc nghi thức đã được chọn và
    giải thích rõ quy tắc đó.
-   Không tự khẳng định mọi truyền thống đều dùng cùng một cách gieo
    hoặc cùng ý nghĩa.
-   Kết quả được trình bày có ngữ cảnh, không suy diễn thành lời tiên
    tri chắc chắn.

### 3.3 Điện Kinh Dịch

-   Người dùng gieo sáu hào theo phương pháp đã chọn.
-   Hệ thống hình thành quẻ chủ.
-   Nếu có hào động, hình thành quẻ biến.
-   Lưu phương pháp gieo, thứ tự hào và kết quả từng lần gieo.
-   Phải kiểm thử thứ tự hào từ dưới lên và mapping âm/dương/hào động.
-   Nội dung 64 quẻ và diễn giải phải có nguồn và kiểm duyệt.

### 3.4 Điện Quẻ Đầu Ngày

-   Mỗi ngày có một quẻ chiêm nghiệm.
-   Quy tắc ngày được tính theo múi giờ Asia/Ho_Chi_Minh.
-   Người dùng trong cùng ngày nhận cùng một quẻ nếu sản phẩm quyết định
    cơ chế "một quẻ chung mỗi ngày".
-   Ghi rõ đây là nội dung chiêm nghiệm theo ngày, không phải dự đoán cá
    nhân.
-   Có lịch sử các ngày trước; không cần lưu lượt xem riêng nếu chưa
    cần.

### 3.5 Điện Tình Duyên

-   Nội dung tham khảo về tình cảm, giao tiếp, sự tôn trọng, ranh giới
    và vun đắp quan hệ.
-   Người dùng có thể chọn chủ đề phụ, ví dụ: mối quan hệ hiện tại, tìm
    hiểu, giao tiếp, hàn gắn.
-   Không khẳng định người cụ thể yêu/không yêu người dùng.
-   Không khuyến khích kiểm soát, theo dõi hoặc thao túng người khác.

### 3.6 Điện Công Danh

-   Nội dung tham khảo về công việc, sự nghiệp, học tập, cơ hội và thử
    thách.
-   Có thể chọn chủ đề phụ như công việc hiện tại, định hướng, thay đổi
    công việc.
-   Không đưa ra cam kết tài chính hoặc lời khuyên pháp lý.
-   Khuyến khích người dùng kết hợp thông tin thực tế và tư vấn chuyên
    môn.

## 4. Phạm vi MVP

### Bắt buộc

-   Trang chủ/giới thiệu.
-   Cổng vào và Chính điện.
-   Nghi thức thắp nhang mô phỏng.
-   Sân trung tâm 3D với sáu điểm tương tác.
-   Điều hướng click-to-enter trực tiếp vào sáu phòng.
-   Một scene 3D riêng cho mỗi phòng, có thể ở mức prototype trước.
-   Một luồng xin xăm hoàn chỉnh với bộ dữ liệu demo được đánh nhãn rõ;
    trước public phải thay bằng nội dung có nguồn.
-   Kết quả quẻ, nguồn và ghi chú biên tập.
-   Nút quay về sân trung tâm ở tất cả phòng.
-   Fallback khi WebGL lỗi; sơ đồ 2D trực quan là hạng mục cần hoàn thiện.
-   Responsive và accessibility cơ bản.
-   Trang giới thiệu, nguồn tư liệu, quyền riêng tư.
-   Người dùng có thể sử dụng toàn bộ trải nghiệm mà không cần tạo tài
    khoản hoặc đăng nhập.

### Có thể triển khai theo giai đoạn

-   Hoàn thiện 100 thẻ xăm.
-   Âm Dương với quy tắc nghi thức được xác minh.
-   Kinh Dịch đầy đủ 64 quẻ và hào động.
-   Quẻ đầu ngày.
-   Tình Duyên và Công Danh.
-   Đồng bộ lịch sử giữa thiết bị và ghi chú cá nhân (ngoài MVP; không
    yêu cầu đăng nhập trong MVP).
-   Admin quản lý nội dung.

### Trạng thái prototype hiện tại

-   Đã có hành trình, sáu phòng hình khối 3D, điều khiển HTML và fallback
    nội dung khi WebGL không khả dụng/lỗi khởi tạo.
-   Các phòng đều có tương tác demo; không phòng nào đang phát hành lời
    luận giải hoặc tư liệu truyền thống chưa xác minh.
-   Trang giới thiệu, nguồn, quyền riêng tư và lịch sử cục bộ đã có.
-   Còn chờ nguồn nội dung/quyền sử dụng được xác minh, asset GLB có
    giấy phép, sơ đồ fallback 2D trực quan, kiểm thử E2E và backend
    production.

### Không thuộc MVP

-   Nhiều ngôi chùa/địa điểm 3D.
-   Nhiều người cùng hiện diện trong một không gian.
-   Livestream, cộng đồng, bình luận.
-   Thanh toán, VIP, quyên góp.
-   AI tự động phán quẻ.
-   Ứng dụng native.
-   VR headset và hand tracking.

## 5. Yêu cầu chức năng

-   FR-01: Người dùng có thể dùng toàn bộ trải nghiệm mà không cần
    đăng ký hoặc đăng nhập.
-   FR-02: Hoàn tất/bỏ qua thắp nhang thì đến sân trung tâm.
-   FR-03: Sáu khu vực hiển thị rõ, có vùng click/touch đủ lớn.
-   FR-04: Click khu vực chuyển thẳng vào scene phòng tương ứng.
-   FR-05: Không có popup/trang trung gian khi vào phòng.
-   FR-06: Có nút quay về sân trung tâm.
-   FR-07: Chỉ tải asset phòng được chọn; có loading và lỗi.
-   FR-08: Các thao tác gieo/xin xăm gửi request đến server.
-   FR-09: Server tạo kết quả; client không tự quyết định quẻ.
-   FR-10: Nội dung quẻ có nguồn, phiên bản và ghi chú.
-   FR-11: Nếu bật lịch sử, chỉ lưu trên thiết bị hiện tại khi người
    dùng đồng ý; không cần tài khoản và không đồng bộ giữa thiết bị.
-   FR-12: Admin quản lý nội dung qua quy trình draft/review/published.

## 6. Yêu cầu phi chức năng

### Hiệu năng

-   Tải trang và nội dung chữ trước scene 3D.
-   Lazy-load scene phòng.
-   Chỉ giữ scene hiện tại và asset dùng chung cần thiết trong bộ nhớ.
-   Dispose tài nguyên scene khi rời phòng nếu không cần cache.
-   Giảm pixel ratio, shadow, particle và texture trên mobile.
-   Có fallback 2D.

### Bảo mật

-   RLS trên dữ liệu; session ẩn danh chỉ truy cập qua API server-side.
-   Service role chỉ ở server.
-   Admin authorization server-side.
-   Validate input và rate limit API.
-   Idempotency cho thao tác tạo kết quả.
-   Không tin kết quả gửi từ client.

### Quyền riêng tư

-   Không bắt buộc ghi lời nguyện.
-   Không lưu lời nguyện mặc định.
-   Lịch sử là riêng tư và có chức năng xóa.
-   Lịch sử tùy chọn trong MVP chỉ lưu trên thiết bị; người dùng có thể
    xóa dữ liệu tại giao diện hoặc bằng cách xóa dữ liệu trình duyệt.
-   Không dùng nội dung riêng tư để quảng cáo hoặc huấn luyện AI.

## 7. Tiêu chí nghiệm thu

-   [ ] Thắp nhang xong đến đúng Sân trung tâm.
-   [ ] Có đủ sáu khu vực với tên dễ nhận biết.
-   [ ] Click một khu vực chuyển thẳng vào đúng phòng, không hiện
    popup/trang trung gian.
-   [ ] Có chuyển cảnh ngắn, không gây say chuyển động.
-   [ ] Mỗi phòng có nút về Sân trung tâm.
-   [ ] Không tải đồng thời toàn bộ sáu scene nặng.
-   [ ] Scene lỗi có retry; prototype hiện giữ điều khiển HTML nhưng
    chưa có sơ đồ fallback 2D trực quan.
-   [ ] Kết quả xin quẻ khớp dữ liệu server.
-   [ ] API chống request trùng.
-   [ ] Nội dung public có nguồn và ghi chú.
-   [ ] Mobile thao tác được.
-   [ ] RLS/admin permission được kiểm thử.

## 8. Chỉ số

Theo dõi tỷ lệ tải thành công scene, thời gian tải, tỷ lệ chuyển về 2D,
lỗi chuyển phòng, tỷ lệ hoàn thành nghi thức và lỗi API. Không tối ưu
theo hướng khiến người dùng xin quẻ lặp lại hoặc lệ thuộc.
