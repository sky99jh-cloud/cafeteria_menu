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
              text: `이 주간 급식 메뉴표 이미지를 분석합니다. 아래 순서대로 진행하세요.

**1단계: 날짜 컬럼 헤더 확인**
표 상단에서 "N월 N일\\nMON" 형태의 날짜+요일 헤더를 가진 컬럼들을 왼쪽부터 순서대로 나열하세요.
주의: 표 맨 왼쪽의 "건강생각아침", "정성가득점심" 세로 레이블 영역은 날짜 컬럼이 아닙니다. 제외하세요.

**2단계: 각 날짜 컬럼별 메뉴 추출**
각 날짜 컬럼에 대해, 그 컬럼과 동일한 열 안에 있는 항목들을 추출합니다.
- "건강생각아침" 행: 그 날의 breakfast 항목들
- "정성가득점심" 행: 그 날의 lunch 항목들
- 셀이 비어 있으면 빈 배열 []

**3단계: JSON 출력**
날짜는 YYYY-MM-DD 형식으로 변환하세요. (예: "3월 30일" → "2026-03-30")
아래 형식의 JSON을 출력하세요:

{
  "week": "2026-03-30 ~ 2026-04-03",
  "days": [
    {
      "date": "2026-03-30",
      "dayName": "MON",
      "dayLabel": "월",
      "breakfast": [],
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
