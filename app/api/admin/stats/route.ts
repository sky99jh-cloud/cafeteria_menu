import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dailyKey = `visits:daily:${today}`;
  const totalKey = `visits:total`;

  const [todayCount, totalCount] = await Promise.all([
    redis.get<number>(dailyKey),
    redis.get<number>(totalKey),
  ]);

  return NextResponse.json({
    today: todayCount ?? 0,
    total: totalCount ?? 0,
  });
}
