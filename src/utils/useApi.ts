"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseApiOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  type?: "mount" | "manual";
  slug?: string | number;
  autoFetch?: boolean;
  params?: Record<string, any>;
  requiresAuth?: boolean;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export default function useApi(options: UseApiOptions) {
  const {
    url,
    method = "GET",
    type = "manual",
    slug,
    autoFetch = true,
    params = {},
    requiresAuth = true,
  } = options;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState(params);

  // Build query string
  const buildQuery = (obj: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "")
        query.append(key, String(value));
    });
    return query.toString() ? `?${query.toString()}` : "";
  };

  const buildUrl = () => {
    const query = buildQuery(queryParams);
    const finalSlug = slug ? `/${slug}` : "";
    return `${baseUrl}${url}${finalSlug}${query}`;
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    }
    return "";
  };

  // Generic request function
  const request = async <T = any>(customMethod: string, payload?: any): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      const token = getToken();

      if (requiresAuth && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let body: BodyInit | undefined;

      // Handle FormData vs JSON
      if (payload instanceof FormData) {
        body = payload; // fetch will set the correct headers
      } else if (customMethod !== "GET" && payload) {
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(buildUrl(), {
        method: customMethod,
        headers,
        body,
      });

      const json: T = await res.json();

      if (res.status === 401 || res.status === 403) {
        setError("Session expired. Redirecting to login...");
        localStorage.removeItem("token");
        setTimeout(() => router.push("/admin/login"), 1500);
        return json;
      }

      if (!res.ok) {
        setError((json as any).message || "Request failed");
      } else {
        setData((json as any).data || json);
      }

      return json;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Manual fetch
  const fetchApi = async () => request(method);

  // Send data (POST, PATCH, PUT)
  const sendData = async <T = any>(
    payload: any,
    callback?: (data: T) => void,
    customMethod: "POST" | "PUT" | "PATCH" = "POST"
  ): Promise<T> => {
    const response = await request<T>(customMethod, payload);
    if (typeof callback === "function") callback(response);
    return response;
  };

  const updateParams = (newParams: Record<string, any>) => {
    setQueryParams((prev) => ({ ...prev, ...newParams }));
  };

  useEffect(() => {
    if (type === "mount" && autoFetch) {
      fetchApi();
    }
  }, [JSON.stringify(queryParams)]);

  return {
    loading,
    data,
    error,
    fetchApi,
    sendData,
    updateParams,
    queryParams,
  };
}
