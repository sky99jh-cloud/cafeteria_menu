import { NextRequest, NextResponse } from "next/server";
import { getMenu, saveMenu } from "@/lib/menu-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const menu = await request.json();
    await saveMenu(menu);
    return NextResponse.json(menu);
  } catch {
    return NextResponse.json({ error: "Failed to save menu" }, { status: 500 });
  }
}
