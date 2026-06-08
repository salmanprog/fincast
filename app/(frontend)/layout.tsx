"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/common/Footer";
import FincastFrontendNav from "@/components/common/FincastFrontendNav";
import NextAuthProvider from "@/components/providers/NextAuthProvider";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isUserPanel = pathname.startsWith("/dashboard");
  const showFooter = !isUserPanel && !pathname.startsWith("/book-call");

  return (
    <NextAuthProvider>
      <div className={`min-h-screen antialiased ${isUserPanel ? "bg-gray-50 dark:bg-gray-950" : "bg-[#f4f7fb]"}`}>
        {!isUserPanel ? <FincastFrontendNav /> : null}
        <main>{children}</main>
        {showFooter ? <Footer /> : null}
      </div>
    </NextAuthProvider>
  );
}
