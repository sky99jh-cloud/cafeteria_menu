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

  // 캐시 확인
  const cacheKey = `food-image:${query}`;
  const cached = await redis.get<string | null>(cacheKey);
  if (cached) {
    return NextResponse.json({ url: cached });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ url: null });
  }

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=1&sort=sim&filter=medium`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );

    const data = await res.json();
    const url = data.items?.[0]?.thumbnail || null;

    // 이미지를 찾은 경우에만 캐시 (30일)
    if (url) {
      await redis.set(cacheKey, url, { ex: 60 * 60 * 24 * 30 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null });
  }
}
