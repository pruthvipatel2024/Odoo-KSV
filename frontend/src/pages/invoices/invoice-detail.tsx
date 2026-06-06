import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi, API_BASE_URL } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { ChevronLeft, Calendar, Building, Landmark, Printer, Download, CreditCard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [payError, setPayError] = useState<string | null>(null);

  // Fetch Invoice details
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice-detail", id],
    queryFn: () => api.get(`/api/invoices/${id}`),
    enabled: !!id,
  });

  // Pay invoice mutation
  const payMutation = useMutation({
    mutationFn: () => api.put(`/api/invoices/${id}/pay`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", id] });
    },
    onError: (err: any) => {
      setPayError(err.message || "Failed to process payment confirmation");
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!invoice || !id) return;
    const downloadUrl = `${API_BASE_URL}/api/invoices/${id}/download`;
    // Open in a new tab to let browser stream the PDF directly!
    const token = localStorage.getItem("vendorbridge_token");
    
    // In order to authenticate via browser tab download, we pass token as query parameter
    // or let it prompt. Since GET requests on browser windows can't set headers, 
    // a standard way is to stream via custom link or write pdf_url which serves it locally.
    // Our pdf_url points to f"/api/uploads/invoices/{file_name}" which is a static route,
    // which is accessible globally or locally. Let's open the static invoice.pdf_url directly!
    if (invoice.pdf_url) {
      window.open(`${API_BASE_URL}${invoice.pdf_url}`, "_blank");
    } else {
      // Fallback
      window.open(downloadUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !invoice) {
    return <Alert variant="destructive">Error loading Invoice: {error?.message}</Alert>;
  }

  const isManagerOrAdmin = user && (user.role === "ADMIN" || user.role === "MANAGER");

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:text-black">
      {/* Header (Hidden when printing) */}
      <div className="print:hidden">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <ChevronLeft size={14} /> Back to invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Landmark className="text-indigo-500 h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Invoice #{invoice.invoice_number}</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Ref PO Contract: #{invoice.po_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={invoice.status === "PAID" ? "success" : "warning"}>
              {invoice.status}
            </Badge>
          </div>
        </div>
      </div>

      {payError && <Alert variant="destructive" className="print:hidden">{payError}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Main Tax Invoice Sheet */}
        <Card className="lg:col-span-3 bg-slate-900/10 border-slate-800 p-8 shadow-2xl space-y-8 print:col-span-4 print:border-none print:shadow-none print:p-0">
          {/* Sourcing Identity */}
          <div className="flex justify-between items-start border-b border-slate-800/80 pb-6 print:border-slate-300">
            <div>
              <h3 className="text-lg font-black text-slate-100 print:text-black">VendorBridge ERP</h3>
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mt-0.5 print:text-indigo-600">
                Sourcing Settle System
              </p>
            </div>
            <div className="text-right">
              <h4 className="text-xl font-black text-slate-200 print:text-black uppercase tracking-wider">
                Tax Invoice
              </h4>
              <span className="text-xs font-mono text-slate-400 print:text-slate-500">
                Original Copy
              </span>
            </div>
          </div>

          {/* Supplier vs Invoice metadata columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div>
              <p className="font-black text-indigo-400 uppercase tracking-wider text-[10px] mb-2 print:text-indigo-600">
                Supplier / Payee Details
              </p>
              <h5 className="font-bold text-slate-200 text-sm print:text-black mb-1">
                {invoice.vendor?.company_name}
              </h5>
              <p className="text-slate-400 print:text-slate-600">
                GSTIN: <strong className="text-slate-300 font-mono print:text-black">{invoice.vendor?.gst_number}</strong>
              </p>
              <p className="text-slate-400 print:text-slate-600">
                Email: {invoice.vendor?.contact_email}
              </p>
              <p className="text-slate-400 print:text-slate-600">
                Phone: {invoice.vendor?.contact_phone || "N/A"}
              </p>
              <p className="text-slate-400 print:text-slate-600 mt-1 max-w-xs">
                {invoice.vendor?.address || "N/A"}
              </p>
            </div>
            <div className="md:text-right">
              <p className="font-black text-indigo-400 uppercase tracking-wider text-[10px] mb-2 md:justify-end print:text-indigo-600">
                Billing References
              </p>
              <p className="text-slate-400 print:text-slate-600">
                Invoice Date: <strong className="text-slate-300 print:text-black">{new Date(invoice.invoice_date).toLocaleDateString()}</strong>
              </p>
              <p className="text-slate-400 print:text-slate-600">
                Purchase Order Ref: <strong className="text-slate-300 print:text-black">{invoice.po_number || "N/A"}</strong>
              </p>
              <p className="text-slate-400 print:text-slate-600">
                Invoice Total: <strong className="text-slate-300 print:text-black">INR {invoice.total_amount.toLocaleString()}</strong>
              </p>
            </div>
          </div>

          {/* Sourcing Itemized list */}
          <div className="space-y-4">
            <h5 className="font-black text-indigo-400 uppercase tracking-wider text-[10px] border-b border-slate-850 pb-2 print:text-indigo-600 print:border-slate-350">
              Taxable Scope Items
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-800 print:text-slate-600 print:border-slate-300">
                  <tr>
                    <th className="py-2">Material Description</th>
                    <th className="py-2 text-right">Quantity</th>
                    <th className="py-2 text-right">Unit Rate (INR)</th>
                    <th className="py-2 text-right">Taxable Value (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 print:text-black print:divide-slate-200">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-3 font-semibold text-slate-200 print:text-black">{item.item_description}</td>
                        <td className="py-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">{item.unit_price.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono font-bold text-slate-200 print:text-black">
                          {(item.quantity * item.unit_price).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 font-semibold text-slate-200 print:text-black">
                        Procurement Services under Sourcing Code {invoice.invoice_number}
                      </td>
                      <td className="py-3 text-right font-mono">1</td>
                      <td className="py-3 text-right font-mono">{invoice.subtotal.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-200 print:text-black">
                        {invoice.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax computations */}
          <div className="border-t border-slate-800 pt-6 flex justify-end print:border-slate-300">
            <div className="w-64 space-y-2 text-xs leading-relaxed text-slate-400 print:text-black">
              <div className="flex justify-between">
                <span>Taxable Subtotal:</span>
                <span className="font-mono text-slate-200 font-semibold print:text-black">
                  INR {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Integrated GST ({invoice.gst_rate}%):</span>
                <span className="font-mono text-slate-200 font-semibold print:text-black">
                  INR {invoice.gst_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm text-slate-100 print:text-black print:border-slate-300">
                <span>Total Tax Inclusive:</span>
                <span className="font-mono text-indigo-400 font-black print:text-black">
                  INR {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & jurisdictional conditions */}
          <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-850 pt-4 max-w-md print:text-slate-600 print:border-slate-300">
            <p className="font-bold mb-1">Declaration & Terms:</p>
            <p>1. Interest @18% p.a. will be levied if payment is not cleared within due time.</p>
            <p>2. This document is a digitally encrypted tax invoice requiring no physical signature.</p>
          </div>
        </Card>

        {/* Action Panel Column */}
        <Card className="lg:col-span-1 h-fit print:hidden">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5 cursor-pointer" onClick={handleDownloadPDF}>
              <Download size={15} /> Export PDF Format
            </Button>
            <Button variant="outline" className="w-full flex items-center justify-center gap-1.5 cursor-pointer" onClick={handlePrint}>
              <Printer size={15} /> Print Document
            </Button>

            {isManagerOrAdmin && invoice.status === "PENDING" && (
              <div className="border-t border-slate-800/60 pt-3 mt-1">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 cursor-pointer"
                  onClick={() => payMutation.mutate()}
                  disabled={payMutation.isPending}
                >
                  <CreditCard size={15} />
                  {payMutation.isPending ? "Confirming..." : "Confirm Payment (Paid)"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default InvoiceDetail;
