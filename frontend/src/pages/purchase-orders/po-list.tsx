import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Search, Calendar, Landmark, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";

export const POList: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch Purchase Orders
  const { data: pos, isLoading, error } = useQuery({
    queryKey: ["purchase-orders", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      return api.get(`/api/purchase-orders?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight">Purchase Orders (PO)</h2>
        <p className="text-sm text-slate-400">
          Manage commercial contracts, track vendor fulfillments, and verify billing conditions.
        </p>
      </div>

      {/* Sourcing Filters */}
      <Card>
        <CardContent className="pt-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Search by PO Contract Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 pt-2 pl-5 pr-5 shrink-0 overflow-x-auto pb-1">
            {[
              { label: "All POs", value: "" },
              { label: "Pending Approval", value: "PENDING_APPROVAL" },
              { label: "Approved", value: "APPROVED" },
              { label: "Sent to Vendor", value: "SENT" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Cancelled/Rejected", value: "CANCELLED" },
            ].map((btn) => (
              <Button
                key={btn.value}
                variant={statusFilter === btn.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setStatusFilter(btn.value)}
                className="whitespace-nowrap cursor-pointer"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PO Matrix Table */}
      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Querying purchase contracts...</div>
          ) : error ? (
            <Alert variant="destructive">Error: {error.message}</Alert>
          ) : pos && pos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Contract</TableHead>
                  <TableHead>Award Value</TableHead>
                  <TableHead>Supplier Representative</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Contract Status</TableHead>
                  <TableHead className="text-right">Workspace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po: any) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-300">
                      {po.po_number}
                    </TableCell>
                    <TableCell className="font-bold text-slate-200">
                      INR {po.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-300">{po.vendor?.company_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">GST: {po.vendor?.gst_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-300 font-semibold">
                        <Calendar size={13} />
                        <span>{new Date(po.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          po.status === "COMPLETED"
                            ? "success"
                            : po.status === "APPROVED" || po.status === "SENT"
                            ? "info"
                            : po.status === "PENDING_APPROVAL"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/purchase-orders/${po.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">
                          <FileSpreadsheet size={13} className="mr-1" />
                          Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">No purchase contracts registered in database</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default POList;
