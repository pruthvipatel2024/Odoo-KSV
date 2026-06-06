import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Search, ShieldCheck, ShieldAlert, Star, FileCheck, Ban } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";
import { Dialog } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";

export const VendorList: React.FC = () => {
  const api = useApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Vendors
  const { data: vendors, isLoading, error: queryError } = useQuery({
    queryKey: ["vendors", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      return api.get(`/api/vendors?${params.toString()}`);
    },
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: number; status: string; remarks: string }) =>
      api.put(`/api/vendors/${id}/status`, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDialogOpen(false);
      setRemarks("");
      setSelectedVendorId(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update vendor status");
    },
  });

  const handleStatusAction = (vendorId: number, status: string) => {
    setSelectedVendorId(vendorId);
    setSelectedStatus(status);
    setRemarks("");
    setError(null);
    setDialogOpen(true);
  };

  const handleConfirmStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;
    statusMutation.mutate({
      id: selectedVendorId,
      status: selectedStatus,
      remarks,
    });
  };

  const isManagerOrAdmin = user && (user.role === "ADMIN" || user.role === "MANAGER");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-100 tracking-tight">Suppliers Directory</h2>
        <p className="text-sm text-slate-400">
          Manage and review registered corporate vendor profiles.
        </p>
      </div>

      {/* Filters bar */}
      <Card>
        <CardContent className="pt-5 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Search by Company Name, GSTIN, or Contact Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1">
            {[
              { label: "All Statuses", value: "" },
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Blacklisted", value: "BLACKLISTED" },
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

      {/* Suppliers Table */}
      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Retrieving supplier database...</div>
          ) : queryError ? (
            <Alert variant="destructive">Error: {queryError.message}</Alert>
          ) : vendors && vendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Details</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  {isManagerOrAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor: any) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-semibold text-slate-200">
                      <Link to={`/vendors/${vendor.id}`} className="hover:text-indigo-400 block">
                        {vendor.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{vendor.gst_number}</TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-300">{vendor.contact_email}</div>
                      <div className="text-[10px] text-slate-500">{vendor.contact_phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star size={12} fill="currentColor" />
                        <span>{vendor.rating.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vendor.status === "APPROVED"
                            ? "success"
                            : vendor.status === "PENDING"
                            ? "warning"
                            : vendor.status === "REJECTED"
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    {isManagerOrAdmin && (
                      <TableCell className="text-right space-x-1.5 whitespace-nowrap">
                        {vendor.status !== "APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusAction(vendor.id, "APPROVED")}
                            className="bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950 hover:text-white"
                          >
                            <ShieldCheck size={14} className="mr-1" />
                            Approve
                          </Button>
                        )}
                        {vendor.status === "PENDING" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusAction(vendor.id, "REJECTED")}
                            className="bg-red-950/20 text-red-400 border-red-900/40 hover:bg-red-950 hover:text-white"
                          >
                            <ShieldAlert size={14} className="mr-1" />
                            Reject
                          </Button>
                        )}
                        {vendor.status === "APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusAction(vendor.id, "BLACKLISTED")}
                            className="bg-slate-900 text-red-500 border-slate-800 hover:bg-red-950 hover:text-white"
                          >
                            <Ban size={14} className="mr-1" />
                            Blacklist
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">No suppliers match your search filters</div>
          )}
        </CardContent>
      </Card>

      {/* Approval Remarks Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`Confirm Supplier Transition: ${selectedStatus}`}
      >
        <form onSubmit={handleConfirmStatus} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          <p className="text-xs text-slate-400">
            Please provide administrative remarks justifying status transition to{" "}
            <strong className="text-indigo-400">{selectedStatus}</strong>.
          </p>
          <Textarea
            label="Remarks / Feedback"
            placeholder="Provide feedback to the supplier..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={selectedStatus === "APPROVED" ? "primary" : "danger"}
              disabled={statusMutation.isPending}
              className="cursor-pointer"
            >
              {statusMutation.isPending ? "Processing..." : "Confirm Status"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default VendorList;
