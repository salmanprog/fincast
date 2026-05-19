"use client";

import { useEffect, useState } from "react";
import type { ForecastDetail } from "@/components/forecasts/forecastReportTypes";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function useForecastDetail(id: string) {
  const [detail, setDetail] = useState<ForecastDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid forecast link.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const token = getStoredAuthToken();
      if (!token) {
        setError("Please sign in to view this forecast.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/forecasts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as {
          code?: number;
          message?: string;
          data?: ForecastDetail;
        };
        if (cancelled) return;
        if (!res.ok || !json.data) {
          setError(json.message || `Could not load forecast (${res.status}).`);
          setDetail(null);
          return;
        }
        setDetail(json.data);
      } catch {
        if (!cancelled) setError("Network error while loading forecast.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { detail, error, loading };
}
