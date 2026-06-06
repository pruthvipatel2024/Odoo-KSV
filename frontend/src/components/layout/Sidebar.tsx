import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  FileCheck,
  ShieldCheck,
  Building,
  BarChart3,
  Menu,
  X,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;

  // Define nav links based on role
  const links = [
    {
      title: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={18} />,
      roles: ["ADMIN", "PROCUREMENT", "MANAGER", "VENDOR"],
    },
    {
      title: "Vendors",
      path: "/vendors",
      icon: <Users size={18} />,
      roles: ["ADMIN", "PROCUREMENT", "MANAGER"],
    },
    {
      title: "RFQs",
      path: "/rfqs",
      icon: <FileText size={18} />,
      roles: ["ADMIN", "PROCUREMENT", "MANAGER", "VENDOR"],
    },
    {
      title: "Purchase Orders",
      path: "/purchase-orders",
      icon: <FileSpreadsheet size={18} />,
      roles: ["ADMIN", "PROCUREMENT", "MANAGER", "VENDOR"],
    },
    {
      title: "Invoices",
      path: "/invoices",
      icon: <FileCheck size={18} />,
      roles: ["ADMIN", "PROCUREMENT", "MANAGER", "VENDOR"],
    },
    {
      title: "Reports",
      path: "/reports",
      icon: <BarChart3 size={18} />,
      roles: ["ADMIN", "PROCUREMENT", "MANAGER"],
    },
  ];

  const activeLinkStyle =
    "flex items-center gap-3 px-4 py-3 bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 text-sm font-semibold transition-all";
  const inactiveLinkStyle =
    "flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-4 border-transparent text-sm font-semibold transition-all";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-slate-950 border-r border-slate-900 w-64 z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900">
            <Link to="/" className="flex items-center gap-2">
              <Building className="text-indigo-500 h-6 w-6" />
              <span className="font-extrabold text-slate-100 tracking-wider text-lg">
                VendorBridge
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 md:hidden p-1 rounded-md hover:bg-slate-900 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Status Card */}
          <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-900/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 border border-indigo-900/40 text-indigo-400 mt-1 uppercase tracking-widest">
                  {role}
                </span>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
            {links
              .filter((lnk) => lnk.roles.includes(role))
              .map((lnk) => {
                const isActive = location.pathname === lnk.path || 
                  (lnk.path !== "/" && location.pathname.startsWith(lnk.path));
                return (
                  <Link
                    key={lnk.path}
                    to={lnk.path}
                    onClick={() => setIsOpen(false)}
                    className={isActive ? activeLinkStyle : inactiveLinkStyle}
                  >
                    {lnk.icon}
                    <span>{lnk.title}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-900 mt-auto">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-950/10 rounded-md text-sm font-semibold transition-all cursor-pointer"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
