import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Login",
  description: "Admin Login Page",
};

export default function SignIn() {
  return <SignInForm />;
}
