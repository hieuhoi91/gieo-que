import Link from "next/link";
import InfoLinks from "@/components/info-links";

export const metadata = { title: "Nguồn nội dung — TÂM AN" };

export default function SourcesPage() {
  return (
    <div className="info-shell">
      <header className="info-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">安</span>
          <span className="brand-name">TÂM AN</span>
        </Link>
        <Link className="footer-link" href="/">Về trải nghiệm</Link>
      </header>
      <main className="info-content">
        <p className="eyebrow"><span /> MINH BẠCH NỘI DUNG</p>
        <h1>Nguồn và<br /><em>phạm vi demo.</em></h1>
        <div className="info-copy">
          <p>Prototype hiện không sử dụng văn bản quẻ cổ, bản dịch hoặc hình ảnh 3D có nguồn bên ngoài. Chưa có tư liệu truyền thống nào được xác minh hoặc cấp phép để xuất bản. Lời luận giải tại sáu điện được tạo mới từ kết quả mô phỏng; đây là nội dung chiêm nghiệm hiện đại, không phải lời giải truyền thống đã biên tập.</p>
          <p>Số xăm là số ngẫu nhiên từ API demo, không gắn với lời xăm thật. Gieo Âm Dương và sáu hào chỉ minh họa thao tác kỹ thuật. Gợi ý trong ngày và các luận giải Tình Duyên/Công Danh không phải dự đoán.</p>
          <p>Trước khi bổ sung nội dung văn hóa hoặc tư liệu 3D, dự án cần ghi nhận nguồn, tác giả/dịch giả, phiên bản và quyền sử dụng tương ứng.</p>
          <p><Link href="/">Trở về trải nghiệm</Link></p>
        </div>
      </main>
      <InfoLinks />
    </div>
  );
}
