import type { ForecastYearRow } from "@/lib/forecastCalculator";

export type ForecastDetail = {
  id: string;
  userId: number;
  name: string;
  forecastYears: number;
  updatedAt: string;
  user?: { id: number; name: string | null; email: string | null } | null;
  rows: ForecastYearRow[];
};
