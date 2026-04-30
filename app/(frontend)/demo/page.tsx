import FincastDemoWizard from "@/components/demo/FincastDemoWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinCast | Demo",
  description: "Plan your retirement with FinCast",
};

export default function DemoPage() {
  return (
    <main>
      <FincastDemoWizard />
    </main>
  );
}
