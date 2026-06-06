import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Search, Plus, Calendar, Clock, FileSpreadsheet } from "lucide-react";
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

export const RFQList: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch RFQs
  const { data: rfqs, isLoading, error } = useQuery({
    queryKey: ["rfqs", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      return api.get(`/api/rfqs?${params.toString()}`);
    },
  });

  const isProcurementOrAdmin = user && (user.role === "ADMIN" || user.role === "PROCUREMENT");

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">
            Requests For Quotation (RFQ)
          </h2>
          <p className="text-sm text-slate-400">
            Publish, review, and track sourcing requests and supplier bidding activity.
          </p>
        </div>
        {isProcurementOrAdmin && (
          <Link to="/rfqs/create">
            <Button className="w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer">
              <Plus size={16} /> Create Sourcing RFQ
            </Button>
          </Link>
        )}
      </div>

      {/* Sourcing Filters */}
      <Card>
        <CardContent className="pt-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Search Sourcing RFQs by Sourcing Code, Title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1">
            {[
              { label: "All RFQs", value: "" },
              { label: "Draft", value: "DRAFT" },
              { label: "Open Bidding", value: "OPEN" },
              { label: "Closed", value: "CLOSED" },
              { label: "Processed", value: "PROCESSED" },
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

      {/* RFQ Sourcing Matrix */}
      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Querying sourcing listings...</div>
          ) : error ? (
            <Alert variant="destructive">Error: {error.message}</Alert>
          ) : rfqs && rfqs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ Code</TableHead>
                  <TableHead>Sourcing Title</TableHead>
                  <TableHead>Closing Deadline</TableHead>
                  <TableHead>Assigned Suppliers</TableHead>
                  <TableHead>Sourcing Status</TableHead>
                  <TableHead className="text-right">Workspace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq: any) => {
                  const deadlineDate = new Date(rfq.deadline);
                  const isExpired = deadlineDate < new Date() && rfq.status === "OPEN";
                  return (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-300">
                        {rfq.rfq_number}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-200">
                        <Link to={`/rfqs/${rfq.id}`} className="hover:text-indigo-400 block max-w-xs truncate">
                          {rfq.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${isExpired ? 'text-red-400' : 'text-slate-300'}`}>
                          <Calendar size={13} />
                          <span>{deadlineDate.toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rfq.vendors?.length || 0} Suppliers
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rfq.status === "OPEN"
                              ? "success"
                              : rfq.status === "CLOSED"
                              ? "danger"
                              : rfq.status === "PROCESSED"
                              ? "purple"
                              : "secondary"
                          }
                        >
                          {isExpired ? "EXPIRED" : rfq.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/rfqs/${rfq.id}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer">
                            <FileSpreadsheet size={13} className="mr-1" />
                            Manage
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">No sourcing requests found matching filters</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default RFQList;
