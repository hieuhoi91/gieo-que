import Link from "next/link";
import InfoLinks from "@/components/info-links";

export const metadata = { title: "Quyền riêng tư — TÂM AN" };

export default function PrivacyPage() {
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
        <p className="eyebrow"><span /> QUYỀN RIÊNG TƯ</p>
        <h1>Bạn có quyền<br /><em>chọn lưu hay không.</em></h1>
        <div className="info-copy">
          <p>Prototype không yêu cầu đăng nhập và không lưu kết quả demo vào cơ sở dữ liệu. Khi tạo luận giải, ứng dụng gửi dữ liệu nghi thức (ví dụ số thẻ, hai mặt xu hoặc sáu hào) tới Gemini API của Google; không gửi tên hay thông tin liên hệ. Gemini Free Tier có thể sử dụng dữ liệu gửi lên để cải thiện sản phẩm theo điều khoản của Google. Không nhập thông tin cá nhân nhạy cảm.</p>
          <p>Các API chỉ xử lý yêu cầu để tạo phản hồi và gửi header không lưu cache; nhà cung cấp dịch vụ có thể xử lý dữ liệu theo chính sách lưu trữ/điều khoản của họ.</p>
          <p>Lịch sử chỉ được lưu trong bộ nhớ của trình duyệt trên thiết bị này sau khi bạn chủ động bật lưu. Dữ liệu không đồng bộ giữa thiết bị và có thể bị xóa khi xóa dữ liệu trình duyệt.</p>
          <p>Quản lý hoặc xóa dữ liệu tại <Link href="/history">Lịch sử trên thiết bị</Link>. Tắt lưu sẽ xóa toàn bộ lịch sử cục bộ do ứng dụng quản lý trên thiết bị này.</p>
          <p><Link href="/">Trở về trải nghiệm</Link></p>
        </div>
      </main>
      <InfoLinks />
    </div>
  );
}
