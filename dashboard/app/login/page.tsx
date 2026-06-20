"use client";

import { useState } from "react";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json()) as { ok?: boolean; access_token?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      if (data.access_token) {
        saveToken(data.access_token);
      }

      window.location.href = "/";
    } catch {
      setError("Network error. Check that the dashboard and backend are running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#F8FAFC" }}
    >
      <div className="w-full max-w-[380px] px-4">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
          >
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
            MadalHub Admin
          </h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1A1" }}>
            Sign in to your admin account
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}
        >
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}
            >
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E5E5E5", background: "#FAFAFA", color: "#0F172A" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid #E5E5E5", background: "#FAFAFA", color: "#0F172A" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 cursor-pointer disabled:opacity-70"
              style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
