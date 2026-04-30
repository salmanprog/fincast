"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import useApi from "@/utils/useApi";

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
  const { data, loading, fetchApi } = useApi({
    url: "/api/admin/profile/1",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      getCookie("token");

    if (token) {
      fetchApi();
    }
  }, []);

  useEffect(() => {
    if (data) setUser(data);
  }, [data]);

  const refreshUser = async () => {
    await fetchApi();
  };

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
