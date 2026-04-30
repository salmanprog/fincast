"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { EyeIcon, EyeClosedIcon } from "lucide-react";
import useApi, { ApiResponse } from "@/utils/useApi";
import { useRouter } from "next/navigation";

interface LoginResponse {
  apiTokens?: { apiToken: string }[];
  message?: string;
}

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const { sendData, loading } = useApi({
    url: "/api/admin/login",
    type: "manual",
    requiresAuth: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.email || !form.password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("password", form.password);

      const res: ApiResponse<LoginResponse> = await sendData<ApiResponse<LoginResponse>>(
        formData,
        undefined,
        "POST"
      );

      if (res.code === 200 && res.data?.apiTokens?.[0]?.apiToken) {
        const token = res.data.apiTokens[0].apiToken;
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; Secure; SameSite=Strict`;
        localStorage.setItem("token", token);
        router.push("/admin/dashboard");
      } else {
        setErrorMsg(res.message || "Invalid credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
            Sign In
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email and password to sign in!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {errorMsg && (
              <div className="text-sm text-red-500 font-medium">{errorMsg}</div>
            )}

            <div>
              <Label>
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="info@gmail.com"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeClosedIcon className="fill-gray-500" />
                  )}
                </span>
              </div>
            </div>

            <div>
              <Button
                className="w-full"
                size="sm"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
