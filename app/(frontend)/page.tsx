import type { Metadata } from "next";
import FinCastLanding from "@/components/landing/FinCastLanding";

export const metadata: Metadata = {
  title: "FinCast | Home",
  description:
    "Run a 30-year financial forecast in 60 seconds. Excel-powered retirement modeling without the spreadsheet pain.",
};

export default function HomePage() {
  return <FinCastLanding />;
}
