import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "@/lib/auth-constants";
import { isAdminAccessToken } from "@/lib/jwt";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  let email = "";
  let password = "";

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = String(body.email ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach backend. Start the API on port 3000." },
      { status: 503 },
    );
  }

  if (!backendRes.ok) {
    let message = "Wrong email or password.";
    try {
      const err = (await backendRes.json()) as { message?: string | string[] };
      if (err.message) {
        message = Array.isArray(err.message) ? err.message.join(", ") : err.message;
      }
    } catch {
      /* keep default */
    }
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const data = (await backendRes.json()) as { access_token?: string };
  const token = data.access_token;

  if (!token) {
    return NextResponse.json({ error: "Login failed: no token returned." }, { status: 502 });
  }

  if (!isAdminAccessToken(token)) {
    return NextResponse.json(
      { error: "Admin access only. Account must have role 3." },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ ok: true, access_token: token });
  res.cookies.set(TOKEN_KEY, token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return res;
}
