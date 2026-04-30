"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/common/Footer";
import FincastFrontendNav from "@/components/common/FincastFrontendNav";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const showFooter = !pathname.startsWith("/demo");

  return (
    <div className="min-h-screen bg-[#f4f7fb] antialiased">
      <FincastFrontendNav />
      <main>{children}</main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
