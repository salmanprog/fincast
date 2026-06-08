"use client";

import UserPanelShell from "@/components/frontend-dashboard/UserPanelShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserPanelShell>{children}</UserPanelShell>;
}
