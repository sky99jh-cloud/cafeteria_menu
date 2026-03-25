import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  // 캐시 확인 (배열 또는 구버전 문자열 형태 모두 처리)
  const cacheKey = `food-image:${query}`;
  const cached = await redis.get<string | null>(cacheKey);
  if (cached) {
    const urls = cached.startsWith("[")
      ? (JSON.parse(cached) as string[])
      : [cached];
    return NextResponse.json({ urls });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ urls: [] });
  }

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=3&sort=sim&filter=medium`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    const data = await res.json();
    const urls: string[] = (data.items ?? [])
      .map((item: { thumbnail: string }) => item.thumbnail)
      .filter(Boolean);

    // 결과가 있는 경우에만 캐시 (30일)
    if (urls.length > 0) {
      await redis.set(cacheKey, JSON.stringify(urls), { ex: 60 * 60 * 24 * 30 });
    }

    return NextResponse.json({ urls });
  } catch {
    return NextResponse.json({ urls: [] });
  }
}
