import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  className = "",
}) => {
  const styles = {
    info: "bg-blue-950/40 border-blue-900/60 text-blue-300",
    success: "bg-emerald-950/40 border-emerald-900/60 text-emerald-300",
    warning: "bg-amber-950/40 border-amber-900/60 text-amber-300",
    destructive: "bg-red-950/40 border-red-900/60 text-red-300",
  };

  const icons = {
    info: <Info className="h-4 w-4 shrink-0" />,
    success: <CheckCircle className="h-4 w-4 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
    destructive: <AlertCircle className="h-4 w-4 shrink-0" />,
  };

  return (
    <div className={`flex gap-3 border rounded-lg p-4 text-sm glassmorphic ${styles[variant]} ${className}`}>
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 leading-none">{title}</h5>}
        <div className="text-xs leading-relaxed text-slate-300">{children}</div>
      </div>
    </div>
  );
};
export const AlertTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h5 className={`font-semibold mb-1 leading-none ${className}`}>{children}</h5>
);

export const AlertDescription = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`text-xs leading-relaxed text-slate-300 ${className}`}>{children}</div>
);
