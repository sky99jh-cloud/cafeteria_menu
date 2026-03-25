import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// search.pstatic.net은 만료되는 프록시 URL이므로 실제 원본 URL을 추출
function resolveImageUrl(thumbnail: string): string {
  try {
    if (thumbnail.includes("search.pstatic.net")) {
      const src = new URL(thumbnail).searchParams.get("src");
      if (src) return src;
    }
  } catch {}
  return thumbnail;
}

async function fetchNaverImages(query: string, clientId: string, clientSecret: string): Promise<string[]> {
  const res = await fetch(
    `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=3&sort=sim&filter=medium`,
    { headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret } }
  );
  const data = await res.json();
  return (data.items ?? [])
    .map((item: { thumbnail: string }) => resolveImageUrl(item.thumbnail))
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  // 캐시 확인 (Upstash가 JSON을 자동 파싱하므로 배열/문자열 모두 처리)
  const cacheKey = `food-image:${query}`;
  const cached = await redis.get<string[] | string | null>(cacheKey);
  if (cached) {
    const urls = Array.isArray(cached) ? cached : [cached];
    return NextResponse.json({ urls });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ urls: [] });
  }

  try {
    let urls = await fetchNaverImages(query, clientId, clientSecret);

    // 결과 없으면 앞 단어 제거 후 재검색 (예: "열갈이겉절이" → "겉절이")
    if (urls.length === 0 && query.length > 3) {
      const fallback = query.slice(Math.ceil(query.length / 2));
      urls = await fetchNaverImages(fallback, clientId, clientSecret);
    }

    // 결과가 있는 경우에만 캐시 (30일)
    if (urls.length > 0) {
      await redis.set(cacheKey, urls, { ex: 60 * 60 * 24 * 30 });
    }

    return NextResponse.json({ urls });
  } catch {
    return NextResponse.json({ urls: [] });
  }
}
