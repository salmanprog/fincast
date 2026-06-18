"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/common/Footer";
import FincastFrontendNav from "@/components/common/FincastFrontendNav";
import { useResumeCalendlyBooking } from "@/hooks/useResumeCalendlyBooking";
import { useCalendlyEventListener } from "@/hooks/useCalendlyEventListener";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isUserPanel = pathname.startsWith("/dashboard");
  const showFooter = !isUserPanel && !pathname.startsWith("/book-call");
  useResumeCalendlyBooking();
  useCalendlyEventListener();

  return (
    <div className={`min-h-screen antialiased ${isUserPanel ? "bg-gray-50 dark:bg-gray-950" : "bg-[#f4f7fb]"}`}>
      {!isUserPanel ? <FincastFrontendNav /> : null}
      <main>{children}</main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
