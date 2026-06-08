"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Calendar, Loader2 } from "lucide-react";
import BookCallForm from "@/components/booking/BookCallForm";

export default function BookCallPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    document.title = "FinCast | Book a call";
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Calendar className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Book a call</h1>
            <p className="text-sm text-slate-500">30-minute advisor walkthrough</p>
          </div>
        </div>

        {status === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </p>
        ) : status === "unauthenticated" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Sign in with Google to schedule a call. We request Calendar access so your
              event can be created on your Google Calendar.
            </p>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/book-call" })}
              className="w-full rounded-lg bg-brand-950 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900"
            >
              Continue with Google
            </button>
          </div>
        ) : session?.error ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Google session expired. Please sign in again.
            </p>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/book-call" })}
              className="w-full rounded-lg bg-brand-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-600">
              Signed in as{" "}
              <span className="font-medium text-slate-800">{session?.user?.email}</span>
            </p>
            <BookCallForm
              defaultName={session?.user?.name}
              defaultEmail={session?.user?.email}
            />
          </>
        )}
      </div>
    </div>
  );
}
