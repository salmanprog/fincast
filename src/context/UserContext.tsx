"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import useApi from "@/utils/useApi";
import { getUserIdFromStoredToken } from "@/lib/authClient";

interface UserContextType {
  user: any;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: any) => void; // <-- add this
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  setUser: () => {}, // default no-op
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [profileId, setProfileId] = useState<number | undefined>(undefined);

  useEffect(() => {
    setProfileId(getUserIdFromStoredToken() ?? undefined);
  }, []);

  const { data, loading, fetchApi } = useApi({
    url: "/api/admin/profile",
    method: "GET",
    type: "manual",
    requiresAuth: true,
    slug: profileId,
  });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (profileId) void fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slug-driven manual fetch
  }, [profileId]);

  useEffect(() => {
    if (data) setUser(data);
  }, [data]);

  const refreshUser = async () => {
    await fetchApi();
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
