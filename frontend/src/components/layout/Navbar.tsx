import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, User, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { Badge } from "../ui/badge";
import { NotificationsDropdown } from "../NotificationsDropdown";

interface NavbarProps {
  setIsOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const api = useApi();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["notifications-count"],
    queryFn: () => api.get("/api/notifications/unread-count"),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = countData?.count ?? 0;

  if (!user) return null;

  // Derive page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Analytics Dashboard";
    if (path.startsWith("/vendors")) return "Vendor Management";
    if (path.startsWith("/rfqs")) return "Request For Quotations (RFQs)";
    if (path.startsWith("/purchase-orders")) return "Purchase Orders (PO)";
    if (path.startsWith("/invoices")) return "Tax Invoice Management";
    if (path.startsWith("/reports")) return "Reports & Analytics";
    return "ERP Workspace";
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-slate-950/60 backdrop-blur-md border-b border-slate-900 px-6 py-4">
      {/* Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="text-slate-400 hover:text-slate-200 md:hidden p-1 rounded-md hover:bg-slate-900 cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-100 uppercase tracking-wider">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {user.role === "VENDOR" && user.vendor_status && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Profile Status:</span>
            <Badge
              variant={
                user.vendor_status === "APPROVED"
                  ? "success"
                  : user.vendor_status === "PENDING"
                  ? "warning"
                  : "danger"
              }
            >
              {user.vendor_status}
            </Badge>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationsDropdown
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
          />
        </div>

        {/* User Avatar */}
        <div className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900 text-slate-400">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};
