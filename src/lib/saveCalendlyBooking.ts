import { getStoredAuthToken } from "@/lib/authClient";

export type CalendlyScheduledPayload = {
  event?: { uri?: string };
  invitee?: { uri?: string };
};

const inFlight = new Map<string, Promise<{ ok: boolean; message?: string }>>();

function bookingKey(eventUri: string, inviteeUri: string): string {
  return `${eventUri}|${inviteeUri}`;
}

function isAlreadySaved(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(`fincast:calendly:${key}`) === "saved";
  } catch {
    return false;
  }
}

function markSaved(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`fincast:calendly:${key}`, "saved");
  } catch {
    // ignore quota / private mode errors
  }
}

export async function saveCalendlyBooking(
  payload: CalendlyScheduledPayload
): Promise<{ ok: boolean; message?: string }> {
  const calendlyEventUri = payload.event?.uri?.trim();
  const calendlyInviteeUri = payload.invitee?.uri?.trim();

  if (!calendlyEventUri || !calendlyInviteeUri) {
    return { ok: false, message: "Missing Calendly event details." };
  }

  const key = bookingKey(calendlyEventUri, calendlyInviteeUri);
  if (isAlreadySaved(key)) {
    return { ok: true, message: "Booking already saved." };
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const token = getStoredAuthToken();
  if (!token) {
    return { ok: false, message: "Please log in to save your booking." };
  }

  const promise = (async (): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ calendlyEventUri, calendlyInviteeUri }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || !json.success) {
        return { ok: false, message: json.message ?? "Could not save booking." };
      }

      markSaved(key);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fincast:booking-saved"));
      }

      return { ok: true, message: json.message };
    } catch {
      return { ok: false, message: "Network error while saving booking." };
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
