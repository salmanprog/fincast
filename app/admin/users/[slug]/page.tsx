"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useApi from "@/utils/useApi";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";

interface UserDetails {
  id: number;
  slug: string;
  name: string | null;
  email: string | null;
  mobileNumber: string | null;
  imageUrl: string | null;
  dob: string | null;
  gender: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: number;
    title: string;
    slug: string;
  } | null;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Set page title
  useEffect(() => {
    document.title = "Admin | User Details";
  }, []);

  const { data, loading, error, fetchApi } = useApi({
    url: `/api/admin/users/${slug}`,
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (slug) {
      fetchApi();
    }
  }, [slug]);

  useEffect(() => {
    if (data) {
      setUser(data as UserDetails);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading user details</div>
          <Button onClick={() => router.push("/admin/users")} variant="outline">
            Back to Users List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            User Details
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View detailed information about the user
          </p>
        </div>
        <Button onClick={() => router.push("/admin/users")} variant="outline">
          Back to List
        </Button>
      </div>

      {/* User Details Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image Section */}
          <div className="flex-shrink-0">
            {user.imageUrl ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                <Image
                  src={user.imageUrl}
                  alt={user.name || "User"}
                  width={128}
                  height={128}
                  className="object-cover"
                  unoptimized={user.imageUrl.includes('localhost')}
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                <span className="text-4xl text-gray-500 dark:text-gray-400">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                {user.name || "N/A"}
              </h3>
              <div className="flex items-center gap-2">
                <Badge color={user.status ? "success" : "error"}>
                  {user.status ? "Active" : "Inactive"}
                </Badge>
                {user.role && (
                  <Badge color="primary">{user.role.title}</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  User ID
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  #{user.id}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Email Address
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.email || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Mobile Number
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.mobileNumber || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Date of Birth
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.dob || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Gender
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.gender || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Role
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.role?.title || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Member Since
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Last Updated
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                  {user.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

