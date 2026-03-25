import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dailyKey = `visits:daily:${today}`;
  const totalKey = `visits:total`;

  await Promise.all([
    redis.incr(dailyKey),
    redis.incr(totalKey),
  ]);

  // 일별 카운트는 60일 후 자동 삭제
  await redis.expire(dailyKey, 60 * 60 * 24 * 60);

  return NextResponse.json({ ok: true });
}
