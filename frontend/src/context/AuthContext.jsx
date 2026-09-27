import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=logged out, object=user
  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("bb_token");
    if (!token) {
      setUser(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      localStorage.setItem("bb_user", JSON.stringify(data));
    } catch (e) {
      // offline fallback: use cached user so classroom login persists without internet
      const cached = localStorage.getItem("bb_user");
      if (cached) setUser(JSON.parse(cached));
      else setUser(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("bb_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("bb_refresh", data.refresh_token);
      localStorage.setItem("bb_user", JSON.stringify(data.user));
      // cache credentials hint for offline login (email only, never password)
      localStorage.setItem("bb_last_email", email);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("bb_token", data.access_token);
      localStorage.setItem("bb_user", JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {}
    localStorage.removeItem("bb_token");
    localStorage.removeItem("bb_user");
    localStorage.removeItem("bb_refresh");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh: bootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
