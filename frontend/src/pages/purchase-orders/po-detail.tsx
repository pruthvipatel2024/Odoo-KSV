import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { ChevronLeft, Calendar, Building, ShieldCheck, ShieldAlert, FileSpreadsheet, ArrowRight, Clock, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
import { Dialog } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";

export const PODetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  // Invoice creation form state
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [gstRate, setGstRate] = useState(18.0);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Fetch PO details
  const { data: po, isLoading, error } = useQuery({
    queryKey: ["po-detail", id],
    queryFn: () => api.get(`/api/purchase-orders/${id}`),
    enabled: !!id,
  });

  // Change PO status mutation
  const statusMutation = useMutation({
    mutationFn: (payload: { status: string; remarks: string }) =>
      api.put(`/api/purchase-orders/${id}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po-detail", id] });
      setDialogOpen(false);
      setRemarks("");
    },
    onError: (err: any) => {
      setStatusError(err.message || "Failed to update status");
    },
  });

  const handleOpenStatusDialog = (status: string) => {
    setTargetStatus(status);
    setRemarks("");
    setStatusError(null);
    setDialogOpen(true);
  };

  const handleConfirmStatus = (e: React.FormEvent) => {
    e.preventDefault();
    statusMutation.mutate({
      status: targetStatus,
      remarks,
    });
  };

  // Generate Invoice mutation
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError(null);
    
    if (!invoiceNumber || !invoiceDate) {
      setInvoiceError("Invoice Number and Date are required");
      return;
    }

    setInvoiceLoading(true);
    try {
      const payload = {
        po_id: parseInt(id!),
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        gst_rate: gstRate,
      };
      const inv = await api.post("/api/invoices", payload);
      queryClient.invalidateQueries({ queryKey: ["po-detail", id] });
      setInvoiceOpen(false);
      navigate(`/invoices/${inv.id}`);
    } catch (err: any) {
      setInvoiceError(err.message || "Failed to generate tax invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !po) {
    return <Alert variant="destructive">Error loading Purchase Order: {error?.message}</Alert>;
  }

  const isManagerOrAdmin = user && (user.role === "ADMIN" || user.role === "MANAGER");
  const isProcurementOrAdmin = user && (user.role === "ADMIN" || user.role === "PROCUREMENT");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <ChevronLeft size={14} /> Back to contracts
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-indigo-500 h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">PO Contract #{po.po_number}</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Issued {new Date(po.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Item details */}
          <Card>
            <CardHeader>
              <CardTitle>Contracted Scope of Works</CardTitle>
              <CardDescription>Itemized list of materials and quantities awarded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border border-slate-900 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Rate (INR)</th>
                      <th className="px-4 py-3 text-right">Line Total (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {po.items && po.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-200 font-semibold">{item.item_description}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.unit_price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                          {(item.quantity * item.unit_price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900/50">
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-400">Total Net Amount:</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-400 font-mono text-sm">
                        INR {po.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Workflow history timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Verification History</CardTitle>
              <CardDescription>Approval log and validation remarks timeline</CardDescription>
            </CardHeader>
            <CardContent>
              {po.history && po.history.length > 0 ? (
                <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-5 text-xs">
                  {po.history.map((step: any) => (
                    <div key={step.id} className="relative animate-in fade-in-50 duration-200">
                      {/* Timeline dot */}
                      <span className="absolute -left-6.5 top-0.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Clock size={10} />
                      </span>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-200">
                            Transitioned to <strong className="text-indigo-400 uppercase">{step.status_to}</strong>
                          </p>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            By {step.actor_name} • {new Date(step.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {step.remarks && (
                        <p className="mt-1.5 text-slate-400 italic bg-slate-900/40 border border-slate-900 p-2 rounded leading-relaxed">
                          {step.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center">No history recorded for this contract</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Allocations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex gap-2">
                <Building className="text-slate-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    Awarded Supplier
                  </p>
                  <Link to={`/vendors/${po.vendor_id}`} className="text-indigo-400 font-semibold hover:underline">
                    {po.vendor?.company_name}
                  </Link>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    GSTIN: {po.vendor?.gst_number}
                  </span>
                </div>
              </div>

              {/* Status workflow triggers */}
              <div className="border-t border-slate-900 pt-4 flex flex-col gap-2 shrink-0">
                {isManagerOrAdmin && po.status === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      variant="primary"
                      className="w-full cursor-pointer bg-emerald-700 hover:bg-emerald-600"
                      onClick={() => handleOpenStatusDialog("APPROVED")}
                    >
                      <ShieldCheck size={14} className="mr-1.5" /> Approve Contract
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full cursor-pointer"
                      onClick={() => handleOpenStatusDialog("REJECTED")}
                    >
                      <ShieldAlert size={14} className="mr-1.5" /> Reject Contract
                    </Button>
                  </>
                )}

                {isProcurementOrAdmin && po.status === "APPROVED" && (
                  <Button
                    variant="primary"
                    className="w-full cursor-pointer"
                    onClick={() => handleOpenStatusDialog("SENT")}
                  >
                    <ArrowRight size={14} className="mr-1.5" /> Send to Vendor
                  </Button>
                )}

                {user?.role === "VENDOR" && (po.status === "SENT" || po.status === "APPROVED") && (
                  <Button
                    variant="primary"
                    className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-500"
                    onClick={() => {
                      setInvoiceNumber(`INV-${po.po_number.split("-").slice(1).join("-")}`);
                      setInvoiceDate(new Date().toISOString().split("T")[0]);
                      setInvoiceError(null);
                      setInvoiceOpen(true);
                    }}
                  >
                    <Plus size={14} className="mr-1.5" /> Generate Tax Invoice
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PO Approval Remarks Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={`Workflow Confirmation: ${targetStatus}`}
      >
        <form onSubmit={handleConfirmStatus} className="space-y-4">
          {statusError && <Alert variant="destructive">{statusError}</Alert>}
          <p className="text-xs text-slate-400">
            Please log remarks explaining the transition of PO contract to <strong className="text-indigo-400">{targetStatus}</strong>.
          </p>
          <Textarea
            label="Workflow Remarks"
            placeholder="Log comments..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={targetStatus === "APPROVED" ? "primary" : "danger"}
              disabled={statusMutation.isPending}
              className="cursor-pointer"
            >
              {statusMutation.isPending ? "Updating..." : "Confirm Action"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Invoice Generation Dialog */}
      <Dialog
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Generate Tax Invoice"
      >
        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
          {invoiceError && <Alert variant="destructive">{invoiceError}</Alert>}
          
          <Input
            label="Invoice Number *"
            placeholder="e.g. INV-2026-0001"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />

          <Input
            type="date"
            label="Invoice Date *"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />

          <Input
            type="number"
            label="GST Rate (%) *"
            placeholder="18.0"
            value={gstRate}
            onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            step="any"
            required
          />

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-slate-200">INR {po.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GST ({gstRate}%):</span>
              <span className="text-slate-200">
                INR {((po.total_amount * gstRate) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-slate-100">
              <span>Total Bill Value:</span>
              <span className="text-indigo-400">
                INR {(po.total_amount * (1 + gstRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
            <Button type="button" variant="outline" onClick={() => setInvoiceOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={invoiceLoading}
              className="cursor-pointer"
            >
              {invoiceLoading ? "Generating Invoice..." : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default PODetail;
