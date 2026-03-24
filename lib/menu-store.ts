import { Redis } from "@upstash/redis";
import { WeeklyMenu } from "./types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MENU_KEY = "weekly_menu";

export async function getMenu(): Promise<WeeklyMenu | null> {
  return redis.get<WeeklyMenu>(MENU_KEY);
}

export async function saveMenu(menu: WeeklyMenu): Promise<void> {
  await redis.set(MENU_KEY, menu);
}
