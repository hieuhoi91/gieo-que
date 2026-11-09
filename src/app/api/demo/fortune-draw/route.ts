import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST() {
  const demoNumber = randomInt(1, 101);

  return NextResponse.json(
    {
      demo: true,
      number: demoNumber,
      title: `Thẻ demo số ${String(demoNumber).padStart(2, "0")}`,
      contentStatus: "fictional_demo",
      message:
        "Đây chỉ là kết quả mô phỏng ngẫu nhiên. Nội dung này chưa phải tư liệu truyền thống đã xác minh.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
