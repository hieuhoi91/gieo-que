import { NextResponse } from "next/server";

const reflections = [
  {
    title: "Lắng nghe trước khi vội trả lời",
    prompt: "Hôm nay, có cuộc trò chuyện nào bạn muốn dành thêm sự chú tâm?",
  },
  {
    title: "Đi từng bước vừa sức",
    prompt: "Một việc nhỏ nào sẽ giúp ngày hôm nay trở nên nhẹ nhàng hơn?",
  },
  {
    title: "Cho mình một khoảng nghỉ",
    prompt: "Bạn có thể tạm dừng điều gì để chăm sóc năng lượng của mình?",
  },
  {
    title: "Nhìn lại điều đang có",
    prompt: "Điều giản dị nào trong hôm nay khiến bạn thấy biết ơn?",
  },
  {
    title: "Rõ ràng với điều mình cần",
    prompt: "Ranh giới lành mạnh nào giúp bạn cảm thấy an tâm hơn?",
  },
  {
    title: "Bắt đầu bằng một việc nhỏ",
    prompt: "Bước đầu tiên nào nằm trong tầm tay bạn ngay lúc này?",
  },
  {
    title: "Để sự tò mò dẫn đường",
    prompt: "Có điều gì bạn muốn tìm hiểu mà chưa cần phải biết ngay đáp án?",
  },
];

export async function GET() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const date = formatter.format(new Date());
  const dayIndex = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const reflection = reflections[((dayIndex % reflections.length) + reflections.length) % reflections.length];

  return NextResponse.json(
    {
      demo: true,
      date,
      timezone: "Asia/Ho_Chi_Minh",
      ...reflection,
      notice: "Gợi ý chiêm nghiệm chung trong ngày; không phải quẻ cổ truyền hay dự đoán cá nhân.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
