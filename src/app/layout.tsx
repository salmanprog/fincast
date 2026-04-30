import localFont from "next/font/local";
import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

const outfit = localFont({
  src: [
    { path: "../public/fonts/outfit/Outfit-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/outfit/Outfit-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/outfit/Outfit-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
