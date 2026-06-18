import { getStoredAuthToken } from "@/lib/authClient";



export type CalendlyPrefill = {

  name?: string;

  email?: string;

};



/** Public Calendly scheduling URL — safe for client-side use (no API tokens). */

export function getCalendlyBookingUrl(): string {

  return process.env.NEXT_PUBLIC_CALENDLY_BOOKING_URL ?? "";

}



function buildCalendlyUrl(baseUrl: string, prefill?: CalendlyPrefill): string {

  const url = new URL(baseUrl);

  if (prefill?.name?.trim()) {

    url.searchParams.set("name", prefill.name.trim());

  }

  if (prefill?.email?.trim()) {

    url.searchParams.set("email", prefill.email.trim());

  }

  return url.toString();

}



/**

 * Opens the Calendly popup for logged-in users.

 * Redirects to login when no auth token is present.

 */

export function openCalendlyPopup(

  prefill?: CalendlyPrefill,

  returnUrl?: string

): boolean {

  if (typeof window === "undefined") return false;



  if (!getStoredAuthToken()) {
    const dest = returnUrl || window.location.pathname || "/";
    const url = new URL(dest, window.location.origin);
    url.searchParams.set("bookCall", "1");
    const returnTarget = `${url.pathname}${url.search}`;
    window.location.assign(`/login?returnUrl=${encodeURIComponent(returnTarget)}`);
    return false;
  }



  const baseUrl = getCalendlyBookingUrl();

  if (!baseUrl) {

    console.error("Missing NEXT_PUBLIC_CALENDLY_BOOKING_URL");

    return false;

  }



  const calendlyUrl = buildCalendlyUrl(baseUrl, prefill);



  if (window.Calendly) {

    window.Calendly.initPopupWidget({ url: calendlyUrl });

  } else {

    window.open(calendlyUrl, "_blank", "noopener,noreferrer");

  }



  return true;

}


