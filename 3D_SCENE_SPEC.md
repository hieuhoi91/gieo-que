# 3D SCENE SPEC --- TÂM AN

## 1. Mục tiêu

Đặc tả cách tổ chức không gian 3D, chuyển phòng và tối ưu tải. Đây là
yêu cầu sản phẩm/kỹ thuật, không phải bản vẽ kiến trúc thi công.

## 2. Danh sách scene

  Scene            Vai trò             Asset chính
  ---------------- ------------------- --------------------------------------
  Gate             Cổng Tam Quan       cổng, sân đá, đèn
  Main Hall        Chính điện          bàn thờ, lư hương, nhang
  Courtyard        Sân trung tâm       sân, lối đi, sáu điện/hotspot
  Fortune Sticks   Điện Xin Xăm        ống xăm, 100 thẻ hoặc bộ đại diện
  Yin Yang         Điện Âm Dương       bàn, hai đồng gieo
  I Ching          Điện Kinh Dịch      bàn gieo, đồng xu/vật gieo, bảng hào
  Daily            Điện Quẻ Đầu Ngày   cửa sổ sáng, bàn, thẻ quẻ
  Love             Điện Tình Duyên     không gian ấm, biểu tượng tiết chế
  Career           Điện Công Danh      thư phòng, bàn sách, bút và giấy

## 3. Sân trung tâm

-   Là một scene riêng, không phải menu 2D đặt trên ảnh nền.
-   Sáu điện là công trình/điểm đến có thể nhận biết bằng kiến trúc,
    biển tên hoặc biểu tượng.
-   Hotspot phải có vùng tương tác lớn hơn hình dáng vật thể để dễ chạm
    trên mobile.
-   Không yêu cầu hover để hiểu tên khu vực.
-   Click/tap là vào phòng ngay.
-   Không hiện modal hoặc màn hình xác nhận.

## 4. Chuyển cảnh

-   Khóa thao tác trong lúc transition để tránh click nhiều lần.
-   Có thể fade-to-dark ngắn rồi load scene, hoặc camera travel qua lối
    đi.
-   Chọn phương án ít gây say chuyển động hơn trên mobile.
-   Tôn trọng `prefers-reduced-motion`: chuyển cảnh fade ngắn hoặc cắt
    cảnh nhẹ.
-   Không phát âm thanh đột ngột.
-   Khi vào phòng, camera phải ở vị trí đã thiết kế sẵn; không để người
    dùng xuất hiện ngoài mô hình hoặc xuyên vật thể.

## 5. Camera

-   Ưu tiên camera có giới hạn, tránh người dùng bị lạc.
-   Mỗi phòng có camera start position/target riêng.
-   Sân trung tâm có góc nhìn đủ thấy sáu lối đi.
-   Mobile dùng FOV và framing riêng.
-   Có nút reset view nếu cho phép orbit.

## 6. Asset pipeline

-   GLB/GLTF.
-   Nén mesh bằng Meshopt/Draco khi phù hợp.
-   Nén texture bằng KTX2/Basis khi pipeline hỗ trợ.
-   Tách model thành module nhỏ.
-   Đặt tên node/material nhất quán.
-   Ghi nguồn và giấy phép asset.
-   Kiểm tra scale, pivot, normals, texture và animation trước tích hợp.

## 7. Hiệu năng

-   Không tải cả sáu phòng cùng lúc.
-   Sân trung tâm dùng proxy/LOD cho công trình ở xa.
-   Chỉ tải asset chi tiết khi vào phòng.
-   Giới hạn texture và polygon theo benchmark thiết bị thật.
-   Giảm shadow, postprocessing, particle và pixel ratio trên mobile.
-   Dọn tài nguyên GPU khi rời scene.
-   Đo thời gian tải và memory khi chuyển qua lại nhiều phòng.

## 8. Animation

-   Khi thắp nhang, đầu nhang phát sáng và khói dạng cụm hạt mờ chuyển
    động cuộn nhẹ lên trên; khói không che cảnh. Với reduced motion,
    giữ khói tĩnh và dừng vòng render liên tục.
-   Chính điện có ba cây nhang 3D riêng biệt để chạm. Mỗi cây bay theo
    cung ngắn vào lư hương, chuyển thành nhang đã cắm và làm khói dày hơn;
    cung bay vẫn hoàn tất ở tốc độ ngắn khi bật reduced motion.
-   Nhang cháy có thể dùng particle/shader tiết chế.
-   Ống xăm lắc bằng keyframe/animation; kết quả lấy từ server.
-   Người dùng chạm trực tiếp vào ống xăm 3D để bắt đầu; không dùng bảng
    thông tin che phòng làm hành động chính.
-   Sau khi server trả số, que/thẻ demo rơi khỏi ống xăm; camera/overlay
    tập trung thẻ ở giữa màn hình. Cho phép đóng thẻ và trở lại góc nhìn
    điện; hỗ trợ bàn phím, focus và reduced motion.
-   Ống xăm có thân sơn son, đế/viền đồng, miệng mở nhìn thấy bó thẻ và
    phù hiệu phía trước; chạm làm thân và bó thẻ chuyển động cùng nhau.
-   Đầu dưới các thẻ xăm phải tụ gọn bên trong thân ống; các đầu trên
    mới xòe nhẹ phía trên miệng ống, không để toàn bộ thẻ tràn khỏi hộp.
-   Âm thanh nghi thức là hiệu ứng ngắn tạo bằng Web Audio: tiếng gõ gỗ
    lắc ống, tiếng thẻ rơi, tiếng xu và tiếng hiện kết quả. Tắt mặc định,
    chỉ phát sau thao tác người dùng và có nút bật/tắt; không có âm nền.
-   Đồng xu có thể có animation lật nhưng kết quả phải khớp server.
-   Sáu hào Kinh Dịch xuất hiện theo thứ tự đã chọn.
-   Không để animation tự tạo ra kết quả khác với dữ liệu backend.
-   Sau khi nghi thức hoàn tất, Gemini tạo lời luận giải riêng theo điện từ
  kết quả đã chuẩn hóa phía máy chủ. Hiển thị rõ đây là nội dung AI mới tạo;
  khi API lỗi hoặc thiếu key phải báo lỗi và cho thử lại, không thay bằng
  kết quả có vẻ thành công.
-   Các phòng ngoài Xin Xăm animate vật thể tại chỗ, không làm rung camera
    hoặc toàn cảnh: từng đồng xu tung/lật riêng, từng hào nhấp nhô theo
    nhịp, thẻ ngày lật và phát sáng, từng vòng lay nhẹ, cuộn thư mở từ
    dưới lên. Chuyển động dừng trước khi mở thẻ kết quả.

## 9. Fallback

Nếu WebGL không khả dụng hoặc khởi tạo context bị lỗi:

- Prototype hiện tại hiển thị thông báo lỗi tại chỗ, giữ lại danh sách
  phòng và các điều khiển HTML để chọn phòng/chạy mô phỏng.
- Cần bổ sung sơ đồ sân 2D minh họa trước khi coi fallback trực quan là
  hoàn chỉnh.
- Kết quả và nội dung không phụ thuộc vào trạng thái renderer 3D.

## 10. Checklist nghiệm thu 3D

-   [ ] Sân trung tâm thấy được sáu khu vực.
-   [ ] Mỗi hotspot nhận click/touch ổn định.
-   [ ] Click vào khu vực vào thẳng phòng.
-   [ ] Không có popup/trang trung gian.
-   [ ] Nút về sân hoạt động ở mọi phòng.
-   [ ] Scene chỉ tải khi cần.
-   [ ] Rời phòng không rò rỉ GPU memory.
-   [ ] Camera đúng vị trí trên desktop/mobile.
-   [x] Xin Xăm: chạm ống xăm 3D, lắc, thẻ rơi và mở ở giữa màn hình.
-   [ ] Reduced motion hoạt động.
-   [ ] Chính điện: chạm từng cây nhang, thấy cây bay vào lư hương và
  khói xuất hiện/tăng dần; có thể bỏ qua nghi thức.
-   [ ] Fallback có sơ đồ sân 2D; prototype hiện mới giữ điều khiển HTML.
-   [ ] Asset có giấy phép/nguồn rõ ràng.
