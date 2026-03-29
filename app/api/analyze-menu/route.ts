import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveMenu } from "@/lib/menu-store";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text: `이 주간 급식 메뉴표 이미지를 분석해서 아래 JSON 형식으로 반환해주세요.

**중요: 각 날짜 컬럼을 정확하게 읽으세요.**
- 표의 각 컬럼은 고유한 날짜 헤더(예: "3월 30일 MON")를 가집니다.
- 각 컬럼의 날짜 헤더와 그 컬럼 아래 나열된 메뉴 항목을 정확히 1:1로 매핑하세요.
- 특정 날짜의 셀이 비어 있으면 해당 날의 해당 식사를 빈 배열로 처리하세요.

"건강생각아침" 또는 "아침" 섹션이 breakfast이고, "정성가득점심" 또는 "점심" 섹션이 lunch입니다.
날짜는 이미지에 표시된 날짜를 YYYY-MM-DD 형식으로 변환하세요.
(예: "3월 24일" → 해당 연도를 추론해서 "2026-03-24")

반드시 아래 JSON 형식만 반환하고 다른 텍스트는 포함하지 마세요:

{
  "week": "2026-03-23 ~ 2026-03-27",
  "days": [
    {
      "date": "2026-03-23",
      "dayName": "MON",
      "dayLabel": "월",
      "breakfast": ["메뉴1", "메뉴2"],
      "lunch": ["메뉴1", "메뉴2"]
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse menu data" }, { status: 500 });
    }

    const menuData = JSON.parse(jsonMatch[0]);
    await saveMenu(menuData);
    return NextResponse.json(menuData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
