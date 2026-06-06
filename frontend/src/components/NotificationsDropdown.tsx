import React, { useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../hooks/useApi";
import { Bell, Check, CheckCheck, FileText, Package, Receipt, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  RFQ: <FileText size={14} className="text-indigo-400" />,
  PO: <Package size={14} className="text-green-400" />,
  INVOICE: <Receipt size={14} className="text-amber-400" />,
  VENDOR: <Users size={14} className="text-purple-400" />,
  SUCCESS: <Check size={14} className="text-emerald-400" />,
  WARNING: <Bell size={14} className="text-amber-400" />,
  ERROR: <Bell size={14} className="text-red-400" />,
  INFO: <Bell size={14} className="text-indigo-400" />,
};

const timeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
    enabled: isOpen,
    refetchInterval: 30000, // poll every 30s
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  if (!isOpen) return null;

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-indigo-400" />
          <span className="text-sm font-bold text-slate-100">Notifications</span>
          {unread > 0 && (
            <span className="text-[10px] bg-indigo-600 text-white rounded-full px-1.5 py-0.5 font-bold">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-400 font-semibold transition-colors"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
        {isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Bell size={24} className="mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 transition-colors hover:bg-slate-800/50 ${
                !n.is_read ? "bg-indigo-950/20" : ""
              }`}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
              }}
            >
              <div className="mt-0.5 shrink-0">
                {TYPE_ICON[n.type] || <Bell size={14} className="text-indigo-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-xs font-semibold truncate ${!n.is_read ? "text-slate-100" : "text-slate-300"}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                {n.link && (
                  <Link
                    to={n.link}
                    onClick={onClose}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1 inline-block"
                  >
                    View details →
                  </Link>
                )}
              </div>
              {!n.is_read && (
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
