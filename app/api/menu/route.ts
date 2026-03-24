import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menu-store";

export async function GET() {
  try {
    const menu = await getMenu();
    if (!menu) {
      return NextResponse.json({ error: "No menu available" }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch {
    return NextResponse.json({ error: "Failed to load menu" }, { status: 500 });
  }
}
