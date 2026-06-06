import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Search, Calendar, Landmark, FileSpreadsheet, ArrowRight, FileCheck } from "lucide-react";
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

export const InvoiceList: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch Invoices
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      return api.get(`/api/invoices?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight">Tax Invoices</h2>
        <p className="text-sm text-slate-400">
          Verify supplier tax invoices, review GST breakdowns, and confirm payments.
        </p>
      </div>

      {/* Sourcing Filters */}
      <Card>
        <CardContent className="pt-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Search by Tax Invoice Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 pt-2 pl-5 pr-5 shrink-0 overflow-x-auto pb-1">
            {[
              { label: "All Invoices", value: "" },
              { label: "Pending Verification", value: "PENDING" },
              { label: "Confirmed / Paid", value: "PAID" },
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

      {/* Invoice Grid Table */}
      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Querying tax invoices...</div>
          ) : error ? (
            <Alert variant="destructive">Error: {error.message}</Alert>
          ) : invoices && invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Total Bill Value</TableHead>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Billing Date</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Workspace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-300">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="font-bold text-slate-200">
                      INR {inv.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-300">{inv.vendor?.company_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-300 font-semibold">
                        <Calendar size={13} />
                        <span>{new Date(inv.invoice_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "PAID" ? "success" : "warning"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/invoices/${inv.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">
                          <FileCheck size={13} className="mr-1" />
                          Invoice
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">No tax invoices recorded in database</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default InvoiceList;
