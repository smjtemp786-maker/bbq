import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/common/States";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (user === null) return <Loading label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
