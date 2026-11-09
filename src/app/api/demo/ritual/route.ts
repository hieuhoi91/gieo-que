import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

type RitualRequest = {
  system: "yin-yang" | "iching";
};

function isRitualRequest(value: unknown): value is RitualRequest {
  return typeof value === "object"
    && value !== null
    && "system" in value
    && (value.system === "yin-yang" || value.system === "iching");
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Nội dung gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  if (!isRitualRequest(payload)) {
    return NextResponse.json({ error: "Nghi thức demo không hợp lệ." }, { status: 400 });
  }

  if (payload.system === "yin-yang") {
    const coins = [randomInt(0, 2), randomInt(0, 2)] as const;
    return NextResponse.json(
      {
        demo: true,
        system: payload.system,
        coins,
        heads: coins.filter((coin) => coin === 1).length,
        method: "Mô phỏng kỹ thuật: hai mặt đồng xu được chọn ngẫu nhiên; không đại diện cho một truyền thống cụ thể.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const lines = Array.from({ length: 6 }, () => {
    const total = randomInt(0, 2) + randomInt(0, 2) + randomInt(0, 2) + 6;
    return {
      value: total,
      polarity: total === 7 || total === 9 ? "yang" : "yin",
      changing: total === 6 || total === 9,
    };
  });
  const changedLines = lines.map((line) => ({
    polarity: line.changing ? (line.polarity === "yin" ? "yang" : "yin") : line.polarity,
  }));

  return NextResponse.json(
    {
      demo: true,
      system: payload.system,
      lines,
      changedLines,
      method:
        "Mô phỏng kỹ thuật ba đồng xu, tạo sáu hào từ dưới lên. Đây không phải lời giải hoặc nội dung Kinh Dịch đã biên tập.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
