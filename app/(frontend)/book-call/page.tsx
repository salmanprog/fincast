"use client";



import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { Calendar } from "lucide-react";

import CalendlyBookTrigger from "@/components/booking/CalendlyBookTrigger";
import { getStoredAuthToken } from "@/lib/authClient";
import { useCurrentUser } from "@/utils/currentUser";

export default function BookCallPage() {
  const router = useRouter();
  const { user, loadingUser } = useCurrentUser();

  useEffect(() => {

    document.title = "FinCast | Book a call";

  }, []);



  useEffect(() => {

    if (loadingUser) return;

    if (!getStoredAuthToken()) {

      router.replace("/login?returnUrl=/book-call");

    }

  }, [loadingUser, router]);



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



        <p className="mb-6 text-sm text-slate-600">

          {user

            ? `Signed in as ${user.name || user.email}. Pick a time that works for you — your booking will be saved to your FinCast account.`

            : "Log in to schedule a call. Your booking will be saved to your FinCast account after you confirm in Calendly."}

        </p>



        <CalendlyBookTrigger className="w-full rounded-lg bg-brand-950 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-900">

          Schedule with Calendly

        </CalendlyBookTrigger>

      </div>

    </div>

  );

}

