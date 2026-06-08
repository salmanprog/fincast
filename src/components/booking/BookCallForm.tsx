"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getStoredAuthToken } from "@/lib/authClient";

type BookCallFormProps = {
  defaultName?: string | null;
  defaultEmail?: string | null;
};

export default function BookCallForm({
  defaultName = "",
  defaultEmail = "",
}: BookCallFormProps) {
  const [name, setName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setMeetLink(null);
    setError(null);

    try {
      const token = getStoredAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, email, phone, date, time, message }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: { meetLink?: string | null; htmlLink?: string | null };
      };

      if (!res.ok) {
        setError(json.message ?? "Could not schedule your call.");
        return;
      }

      setSuccessMessage(json.message ?? "Your call has been scheduled.");
      setMeetLink(json.data?.meetLink ?? json.data?.htmlLink ?? null);
      setPhone("");
      setDate("");
      setTime("10:00");
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="space-y-4 rounded-xl bg-emerald-50 p-6 text-sm text-emerald-800">
        <p className="text-base font-medium">{successMessage}</p>
        {meetLink ? (
          <a
            href={meetLink}
            target="_blank"
            rel="noreferrer"
            className="inline-block font-medium text-brand-700 underline"
          >
            Open calendar event
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <label className="block text-sm font-medium text-slate-700">
        Name
        <input
          required
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Phone
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Optional"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Date
          <input
            required
            type="date"
            name="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Time
          <input
            required
            type="time"
            name="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Message
        <textarea
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional — share context for your advisor call"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Scheduling…
          </>
        ) : (
          "Schedule call"
        )}
      </button>
    </form>
  );
}
