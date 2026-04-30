"use client";

import { useState } from "react";
import Link from "next/link";
import { clearCurrentUserCache } from "@/utils/currentUser";
import { extractTokenFromUserPayload, saveAuthToken } from "@/lib/authClient";

type FieldErrors = Record<string, string>;

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email.trim());
      formData.set("password", password);

      const res = await fetch("/api/users/login", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as {
        code: number;
        message: string;
        data?: unknown;
      };

      if (!res.ok) {
        const d = json.data;
        if (d && typeof d === "object" && !Array.isArray(d)) {
          const fe: FieldErrors = {};
          for (const [k, v] of Object.entries(d as Record<string, string>)) {
            if (typeof v === "string") fe[k] = v;
          }
          if (Object.keys(fe).length) setFieldErrors(fe);
        }
        setError(json.message || "Sign in failed");
        return;
      }

      const token = extractTokenFromUserPayload(json.data);
      if (token) {
        saveAuthToken(token);
        clearCurrentUserCache();
        window.location.assign("/");
        return;
      }
      setError("No token in response. Try again or contact support.");
    } catch (err) {
      setError((err as Error).message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use the email and password for your FinCast account.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-brand-200 transition focus:ring-2"
        />
        {fieldErrors.login_error ? (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.login_error}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-brand-200 transition focus:ring-2"
        />
        {fieldErrors.password_error ? (
          <p className="mt-1 text-xs text-rose-600">{fieldErrors.password_error}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-950 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        No account?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
