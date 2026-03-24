import { kv } from "@vercel/kv";
import { WeeklyMenu } from "./types";

const MENU_KEY = "weekly_menu";

export async function getMenu(): Promise<WeeklyMenu | null> {
  return kv.get<WeeklyMenu>(MENU_KEY);
}

export async function saveMenu(menu: WeeklyMenu): Promise<void> {
  await kv.set(MENU_KEY, menu);
}
