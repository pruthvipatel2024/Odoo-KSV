import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, User, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui/badge";

interface NavbarProps {
  setIsOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Derive page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Analytics Dashboard";
    if (path.startsWith("/vendors")) return "Vendor Management";
    if (path.startsWith("/rfqs")) return "Request For Quotations (RFQs)";
    if (path.startsWith("/purchase-orders")) return "Purchase Orders (PO)";
    if (path.startsWith("/invoices")) return "Tax Invoice Management";
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

      {/* Stats/Badges */}
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
        <div className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900 text-slate-400">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};
