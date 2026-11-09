import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TÂM AN — Không gian văn hóa và chiêm nghiệm",
  description:
    "Một không gian trực tuyến để tìm hiểu văn hóa và dành thời gian chiêm nghiệm.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
