import React from "react";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useApi } from "../hooks/useApi";
import { BarChart3, Building, FileText, Package, Receipt, Download } from "lucide-react";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  filename: string;
  color: string;
}

const REPORTS: ReportCard[] = [
  {
    title: "Vendor Directory",
    description: "Export full vendor registry with status, category, and ratings",
    icon: <Building size={22} className="text-indigo-400" />,
    endpoint: "/api/reports/vendors",
    filename: "vendors_report.csv",
    color: "from-indigo-900/30 to-indigo-950/10 border-indigo-800/40",
  },
  {
    title: "RFQ Register",
    description: "Export all sourcing requests with status and deadlines",
    icon: <FileText size={22} className="text-blue-400" />,
    endpoint: "/api/reports/rfqs",
    filename: "rfqs_report.csv",
    color: "from-blue-900/30 to-blue-950/10 border-blue-800/40",
  },
  {
    title: "Purchase Orders",
    description: "Export all purchase orders with amounts and approval status",
    icon: <Package size={22} className="text-green-400" />,
    endpoint: "/api/reports/purchase-orders",
    filename: "purchase_orders_report.csv",
    color: "from-green-900/30 to-green-950/10 border-green-800/40",
  },
  {
    title: "Invoice Register",
    description: "Export all invoices with billing status and amounts",
    icon: <Receipt size={22} className="text-amber-400" />,
    endpoint: "/api/reports/invoices",
    filename: "invoices_report.csv",
    color: "from-amber-900/30 to-amber-950/10 border-amber-800/40",
  },
];

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "PROCUREMENT")) {
    return (
      <Alert variant="destructive">
        Access Denied. Only Admin, Manager, and Procurement roles can access reports.
      </Alert>
    );
  }

  const handleDownload = async (endpoint: string, filename: string) => {
    try {
      // Get the auth token
      const token = localStorage.getItem("vendorbridge_token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://odoo-ksv.onrender.com";
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download failed:", err);
      alert("Failed to download report. Please try again.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="text-indigo-500 h-8 w-8 shrink-0" />
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-slate-400 mt-1">
            Export procurement data to CSV for offline analysis and audits
          </p>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {REPORTS.map((report) => (
          <Card
            key={report.endpoint}
            className={`bg-gradient-to-br ${report.color} transition-all hover:scale-[1.01]`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900/60">{report.icon}</div>
                <div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                id={`export-btn-${report.filename.replace('.csv', '')}`}
                onClick={() => handleDownload(report.endpoint, report.filename)}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 cursor-pointer border-slate-700 hover:border-slate-500"
              >
                <Download size={15} />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/30">
        <h3 className="text-sm font-bold text-slate-200 mb-2">About Reports</h3>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>All reports are exported as standard CSV format compatible with Excel and Google Sheets</li>
          <li>Data is sourced directly from the live database at the time of export</li>
          <li>Reports are for internal use only and subject to your organization's data policies</li>
        </ul>
      </div>
    </div>
  );
};

export default Reports;
