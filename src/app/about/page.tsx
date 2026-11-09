import Link from "next/link";
import InfoLinks from "@/components/info-links";

export const metadata = { title: "Giới thiệu — TÂM AN" };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="GIỚI THIỆU" title={<>Một không gian<br /><em>để lắng lại.</em></>}>
      <p>TÂM AN là prototype trải nghiệm 3D về không gian văn hóa và chiêm nghiệm. Bạn có thể khám phá sáu phòng mô phỏng, không cần tài khoản.</p>
      <p>Sáu điện có lời luận giải chiêm nghiệm dựa trên kết quả mô phỏng; đây không phải lời dự đoán, tư vấn chuyên môn hay tư liệu cổ truyền đã được xác minh.</p>
      <p>Mô hình kiến trúc được dựng bằng hình khối 3D procedural, không đại diện cho một di tích cụ thể.</p>
      <p><Link href="/">Trở về trải nghiệm</Link></p>
    </InfoPage>
  );
}

function InfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
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
        <p className="eyebrow"><span /> {eyebrow}</p>
        <h1>{title}</h1>
        <div className="info-copy">{children}</div>
      </main>
      <InfoLinks />
    </div>
  );
}
