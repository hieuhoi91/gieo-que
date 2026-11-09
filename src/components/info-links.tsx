import Link from "next/link";

export default function InfoLinks() {
  return (
    <nav className="info-links" aria-label="Thông tin">
      <Link href="/about">Giới thiệu</Link>
      <Link href="/sources">Nguồn nội dung</Link>
      <Link href="/privacy">Quyền riêng tư</Link>
      <Link href="/history">Lịch sử trên thiết bị</Link>
    </nav>
  );
}
