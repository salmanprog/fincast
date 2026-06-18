const CALENDLY_API = "https://api.calendly.com";

type CalendlyResource<T> = {
  resource: T;
};

type CalendlyScheduledEvent = {
  uri: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  name?: string;
};

type CalendlyInvitee = {
  uri: string;
  name: string;
  email: string;
  text_reminder_number?: string | null;
  questions_and_answers?: { question: string; answer: string }[];
};

function getCalendlyToken(): string {
  const token = process.env.CALENDLY_TOKEN?.trim();
  if (!token) {
    throw new Error("Calendly API is not configured.");
  }
  return token;
}

async function calendlyGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getCalendlyToken()}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Calendly API error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

export function extractCalendlyUuid(uri: string): string {
  const trimmed = uri.trim().replace(/\/$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] ?? trimmed;
}

/** Event UUID from a Calendly scheduled_events URI (not the invitee segment). */
export function extractCalendlyEventUuid(uri: string): string {
  const match = uri.trim().match(/scheduled_events\/([A-Za-z0-9-]+)/);
  return match?.[1] ?? extractCalendlyUuid(uri);
}

/** Invitee UUID from a Calendly invitees URI. */
export function extractCalendlyInviteeUuid(uri: string): string {
  const match = uri.trim().match(/invitees\/([A-Za-z0-9-]+)/);
  return match?.[1] ?? "";
}

export function formatBookingDateTime(
  isoStart: string,
  timeZone: string
): { date: string; time: string } {
  const start = new Date(isoStart);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid Calendly start time.");
  }

  const date = start.toLocaleDateString("en-CA", { timeZone });
  const time = start.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return { date, time };
}

export async function fetchCalendlyScheduledEvent(uri: string) {
  return calendlyGet<CalendlyResource<CalendlyScheduledEvent>>(uri);
}

export async function fetchCalendlyInvitee(uri: string) {
  return calendlyGet<CalendlyResource<CalendlyInvitee>>(uri);
}

export function buildInviteeMessage(
  invitee: CalendlyInvitee
): string | null {
  const answers = invitee.questions_and_answers ?? [];
  if (answers.length === 0) return null;

  return answers
    .map(({ question, answer }) => `${question}: ${answer}`)
    .join("\n");
}
