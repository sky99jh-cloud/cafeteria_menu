import { NextRequest, NextResponse } from "next/server";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  // Unsplash API 키가 있으면 정확한 검색
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(`Korean food ${query}`)}&per_page=1&orientation=squarish`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
      );
      const data = await res.json();
      const url = data.results?.[0]?.urls?.small || null;
      if (url) return NextResponse.json({ url });
    } catch {
      // fall through to loremflickr
    }
  }

  // 키 없을 때 또는 결과 없을 때: loremflickr (API 키 불필요)
  const url = `https://loremflickr.com/200/200/korean,food,${encodeURIComponent(query)}/all`;
  return NextResponse.json({ url });
}
