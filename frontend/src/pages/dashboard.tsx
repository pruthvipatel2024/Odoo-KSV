import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  Users,
  FileText,
  Clock,
  DollarSign,
  ClipboardList,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { Alert } from "../components/ui/alert";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const Dashboard: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();

  // Fetch Stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/api/dashboard/stats"),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates!
  });

  // Fetch logs (Internal roles only)
  const isInternal = user && user.role !== "VENDOR";
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["dashboard-logs"],
    queryFn: () => api.get("/api/dashboard/logs"),
    enabled: !!isInternal,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (statsError) {
    return <Alert variant="destructive">Error loading dashboard statistics: {statsError.message}</Alert>;
  }

  const kpis = [
    {
      title: "Total Spending",
      value: `INR ${(stats?.summary?.total_spend || 0).toLocaleString()}`,
      description: "Approved & Completed Orders",
      icon: <DollarSign className="text-indigo-400" size={20} />,
    },
    {
      title: isInternal ? "Open RFQs" : "Invited RFQs",
      value: stats?.summary?.pending_rfqs || 0,
      description: "Awaiting Quotation Deadlines",
      icon: <FileText className="text-emerald-400" size={20} />,
    },
    {
      title: isInternal ? "Active Vendors" : "My Submissions",
      value: stats?.summary?.total_vendors || 0,
      description: isInternal ? "Approved Suppliers" : "Quotations Submitted",
      icon: <Users className="text-amber-400" size={20} />,
    },
    {
      title: isInternal ? "Awaiting Action" : "Received Orders",
      value: stats?.summary?.awaiting_approvals || 0,
      description: isInternal ? "POs Pending Manager Approvals" : "POs Sent for Fulfillment",
      icon: <Clock className="text-purple-400" size={20} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          Welcome back, {user?.first_name} 👋
        </h2>
        <p className="text-sm text-slate-400">
          Here is your enterprise procurement overview for today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="p-2 bg-slate-900 rounded-md">{kpi.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-slate-100 tracking-tight">
                {kpi.value}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Procurement Spending Trend</CardTitle>
                <CardDescription>Monthly aggregated award values</CardDescription>
              </div>
              <TrendingUp className="text-indigo-400" size={18} />
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.charts?.spending_trend || []}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>RFQ State Distribution</CardTitle>
            <CardDescription>RFQ volume segmented by current status</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-center items-center">
            <div className="w-full h-[80%]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.charts?.rfq_trends || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {(stats?.charts?.rfq_trends || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
              {(stats?.charts?.rfq_trends || []).map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{entry.status}: {entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trails Logs (Only for internal procurement officers/managers/admins) */}
      {isInternal && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-400" size={18} />
              <div>
                <CardTitle>ERP System Audit Trails</CardTitle>
                <CardDescription>Real-time log of security and procurement actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-slate-900 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-500">
                        Querying audit database...
                      </td>
                    </tr>
                  ) : logs && logs.length > 0 ? (
                    logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200">
                          {log.user_name} ({log.user_email})
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-slate-950 border border-slate-800 text-slate-400 uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-sm">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-500">
                        No audit logs available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default Dashboard;
