import type { Metadata } from "next";
import FinCastPricingPage from "@/components/pricing/FinCastPricingPage";

export const metadata: Metadata = {
  title: "FinCast | Pricing",
  description:
    "Pay only for what you forecast. Credit-based pricing for 30-year retirement reports.",
};

export default function PricingRoutePage() {
  return <FinCastPricingPage />;
}
