import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "FinCast | Register",
  description: "Create a FinCast account.",
};

export default function RegisterPage() {
  return (
    <div className="py-10 md:py-14">
      <RegisterForm />
    </div>
  );
}
