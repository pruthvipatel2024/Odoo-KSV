import React from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface RoleGuardProps {
  allowedRoles: Array<"ADMIN" | "PROCUREMENT" | "MANAGER" | "VENDOR">;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto bg-red-950/40 p-3 rounded-full text-red-500 w-fit mb-3">
              <ShieldAlert size={28} />
            </div>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              Please sign in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto bg-amber-950/40 p-3 rounded-full text-amber-500 w-fit mb-3">
              <ShieldAlert size={28} />
            </div>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              You do not have the required permissions ({allowedRoles.join(", ")}) to view this resource.
              Your current role is <strong className="text-slate-300">{user.role}</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
export default RoleGuard;
