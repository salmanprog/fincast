import { useEffect, useState, useRef } from "react";
import useApi, { ApiResponse } from "@/utils/useApi";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}
// Global cache for user data to avoid refetching on navigation
let cachedUser: User | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function clearCurrentUserCache() {
  cachedUser = null;
  cacheTimestamp = 0;
}

export const useCurrentUser = () => {
  // Start with safe initial states (no client-side checks during SSR)
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const isInitializedRef = useRef(false);

  const { fetchApi } = useApi({
    url: "/api/currentuser",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    // Prevent multiple calls
    if (hasFetchedRef.current) return;

    const getToken = () => {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    };

    const hasToken = getToken();
    const isCacheValid = cachedUser && (Date.now() - cacheTimestamp < CACHE_DURATION);

    // If we have cached user and it's valid, use it immediately
    if (isCacheValid && cachedUser) {
      setUser(cachedUser);
      setLoadingUser(false);
      hasFetchedRef.current = true;
      isInitializedRef.current = true;
      return;
    }

    // If no token, set loading to false immediately
    if (!hasToken) {
      setLoadingUser(false);
      hasFetchedRef.current = true;
      isInitializedRef.current = true;
      return;
    }

    hasFetchedRef.current = true;
    isInitializedRef.current = true;

    let isMounted = true; // avoid state update if unmounted

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const res: any = await fetchApi(); // get raw response

        if (res?.code === 200 && res?.data) {
          if (isMounted) {
            setUser(res.data);
            // Cache the user data
            cachedUser = res.data;
            cacheTimestamp = Date.now();
          }
        } else {
          if (isMounted) setErrorUser(res?.message || "Failed to fetch user");
        }
      } catch (err: any) {
        if (isMounted) setErrorUser(err?.message || "Server error");
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to call only once

  return { user, loadingUser, errorUser };
};
