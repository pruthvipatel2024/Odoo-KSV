import React from "react";

interface BadgeProps {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "info" | "purple";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  className = "",
}) => {
  const styles = {
    default: "bg-indigo-950 text-indigo-300 border-indigo-900/50",
    secondary: "bg-slate-900 text-slate-300 border-slate-800",
    success: "bg-emerald-950 text-emerald-300 border-emerald-900/50",
    warning: "bg-amber-950 text-amber-300 border-amber-900/50",
    danger: "bg-red-950 text-red-300 border-red-900/50",
    info: "bg-sky-950 text-sky-300 border-sky-900/50",
    purple: "bg-purple-950 text-purple-300 border-purple-900/50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
