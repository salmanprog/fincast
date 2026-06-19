import FinCastSelfDemo from "@/components/demo/FinCastSelfDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinCast Reva — Self-Demo",
  description: "FinCast advisor self-demo — retirement depletion visualization in under 60 seconds.",
};

export default function FinCastSelfDemoPage() {
  return (
    <main>
      <FinCastSelfDemo />
    </main>
  );
}
