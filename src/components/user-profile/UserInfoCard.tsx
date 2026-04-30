"use client";

import React, { useState,useEffect } from "react";
import Image from "next/image";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useUser } from "@/context/UserContext";
import useApi from "@/utils/useApi";

interface UserValidationErrors {
  name?: string;
  email?: string;
  mobileNumber?: string;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export default function UserInfoCard() {
  const { user, loading, setUser } = useUser(); // now we can use setUser
  const { isOpen, openModal, closeModal } = useModal();

  const [formData, setFormData] = useState({
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    mobileNumber: user?.mobileNumber || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        id: user?.id || "",
        name: user.name || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
      });
    }
  }, [user]);

  const [errors, setErrors] = useState<UserValidationErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { sendData, loading: apiLoading, error: apiError } = useApi({
    url: "/api/admin/profile/"+user?.id,
    type: "manual",
    method: "PATCH",
    requiresAuth: true,
  });

  // Helper function to normalize image URL
  const normalizeImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    // If it's already a relative path, return as is
    if (url.startsWith('/')) return url;
    // If it's a full URL, extract the path
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If URL parsing fails, assume it's a relative path
      return url.startsWith('/') ? url : `/${url}`;
    }
  };

  // Initialize image preview when user loads or modal opens
  useEffect(() => {
    if (isOpen) {
      if (user?.imageUrl) {
        const normalizedUrl = normalizeImageUrl(user.imageUrl);
        setImagePreview(normalizedUrl);
      } else {
        setImagePreview(null);
      }
    }
  }, [user, isOpen]);

  // Reset image preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset to user's current image when modal closes
      if (user?.imageUrl) {
        const normalizedUrl = normalizeImageUrl(user.imageUrl);
        setImagePreview(normalizedUrl);
      } else {
        setImagePreview(null);
      }
      // Reset file input
      const imageInput = document.getElementById("avatar-image") as HTMLInputElement;
      if (imageInput) {
        imageInput.value = '';
      }
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Image size should be less than 5MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Please select a valid image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setErrorMessage(""); // Clear any previous errors
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage("");

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);
      payload.append("mobileNumber", formData.mobileNumber);
      
      // Add image if a new one was selected
      const imageInput = document.getElementById("avatar-image") as HTMLInputElement;
      if (imageInput?.files?.[0]) {
        payload.append("image", imageInput.files[0]);
      }
      
      const res: ApiResponse<UserValidationErrors> = await sendData(
        payload,
        undefined,
        "PATCH"
      );
      if (!res) {
        setErrorMessage("Something went wrong!");
        return;
      }
      if (res.code === 200) {
        // Update user with new data and imageUrl if returned
        const updatedUser = { ...user, ...formData };
        if (res.data && typeof res.data === 'object' && 'imageUrl' in res.data) {
          (updatedUser as any).imageUrl = (res.data as any).imageUrl;
        }
        setUser(updatedUser);
        closeModal();
        // Reload page to get updated user data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (res.code === 422) {
        setErrors(res.data || {});
      } else {
        setErrorMessage(res.message || "Something went wrong!");
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setErrorMessage(err?.message || "Something went wrong!");
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {loading ? "Loading..." : user?.name || "Admin"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {loading ? "Loading..." : user?.role.title || "Admin"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {loading ? "Loading..." : user?.email || "admin@gmail.com"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {loading ? "Loading..." : user?.mobileNumber || "1231231234"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Personal Information
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Update your details to keep your profile up-to-date.
          </p>

          {(errorMessage || apiError) && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {errorMessage || apiError}
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col">
            {/* Avatar Upload Section */}
            <div className="mb-6">
              <Label>Profile Picture</Label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Avatar Preview"
                      width={100}
                      height={100}
                      className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      unoptimized={imagePreview.startsWith('data:') || imagePreview.includes('localhost')}
                    />
                  </div>
                ) : (
                  <div className="w-[100px] h-[100px] rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-3xl text-gray-600 dark:text-gray-400 font-semibold">
                      {formData.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                      file:text-sm file:font-semibold 
                      file:bg-[var(--primary-theme)] file:text-white 
                      hover:file:bg-[var(--secondary-theme)]
                      dark:file:bg-gray-700 dark:file:text-gray-200"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Max size: 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="col-span-2 lg:col-span-1">
                <Label>Name</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Email</Label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Phone</Label>
                <Input
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                />
                {errors.mobileNumber && (
                  <p className="text-xs text-red-500">{errors.mobileNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit" disabled={apiLoading}>
                {apiLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
