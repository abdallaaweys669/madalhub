import { NextResponse } from "next/server";
import { TOKEN_KEY } from "@/lib/auth-constants";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOKEN_KEY, "", { path: "/", maxAge: 0 });
  return res;
}
