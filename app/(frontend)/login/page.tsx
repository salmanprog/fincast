import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "FinCast | Log in",
  description: "Sign in to your FinCast account.",
};

export default function LoginPage() {
  return (
    <div className="py-10 md:py-14">
      <LoginForm />
    </div>
  );
}
