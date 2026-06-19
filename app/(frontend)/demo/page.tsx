import FinCastSelfDemo from "@/components/demo/FinCastSelfDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinCast Reva — Self-Demo",
  description: "Plan your retirement with FinCast",
};

export default function DemoPage() {
  return (
    <main>
      <FinCastSelfDemo />
    </main>
  );
}
