"use client";

import { useRouter } from "next/navigation";

export function logout() {
  document.cookie = "token=; path=/; max-age=0";
  const router = useRouter();
  router.push("/admin/login");
}
