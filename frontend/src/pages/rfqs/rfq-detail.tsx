import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import {
  ChevronLeft,
  Calendar,
  Building,
  FileText,
  Upload,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  FileCheck,
  Percent,
  Clock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";
import { Dialog } from "../../components/ui/dialog";

interface QuotationItemInput {
  item_description: string;
  quantity: number;
  unit_price: number;
}

export const RFQDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  // Vendor Quotation form states
  const [bidLeadTime, setBidLeadTime] = useState<number>(7);
  const [bidRemarks, setBidRemarks] = useState("");
  const [bidFile, setBidFile] = useState<File | null>(null);
  const [bidItems, setBidItems] = useState<QuotationItemInput[]>([
    { item_description: "", quantity: 1, unit_price: 1 },
  ]);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const [bidSubmitting, setBidSubmitting] = useState(false);

  // PO creation state
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [poRemarks, setPoRemarks] = useState("");
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poError, setPoError] = useState<string | null>(null);

  // Fetch RFQ Detail
  const { data: rfq, isLoading: rfqLoading, error: rfqError } = useQuery({
    queryKey: ["rfq-detail", id],
    queryFn: () => api.get(`/api/rfqs/${id}`),
    enabled: !!id,
  });

  // Initialize bid items when RFQ loads
  React.useEffect(() => {
    if (rfq?.items?.length) {
      setBidItems(
        rfq.items.map((item: any) => ({
          item_description: item.description,
          quantity: item.quantity,
          unit_price: 0,
        }))
      );
    }
  }, [rfq]);

  // Fetch Received Bids (Internal roles only)
  const isInternal = user && user.role !== "VENDOR";
  const { data: bids, isLoading: bidsLoading } = useQuery({
    queryKey: ["rfq-bids", id],
    queryFn: () => api.get(`/api/quotations?rfq_id=${id}`),
    enabled: !!id && !!isInternal,
  });

  // Upload RFQ document mutation
  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !id) return;
    setDocError(null);
    setDocUploading(true);
    
    const formData = new FormData();
    formData.append("file", docFile);
    
    try {
      await api.post(`/api/rfqs/${id}/documents`, formData, { isFormData: true });
      queryClient.invalidateQueries({ queryKey: ["rfq-detail", id] });
      setDocFile(null);
    } catch (err: any) {
      setDocError(err.message || "Failed to upload file");
    } finally {
      setDocUploading(false);
    }
  };

  // Submit Bid mutation (Vendor only)
  const handleAddBidItem = () => {
    setBidItems((prev) => [...prev, { item_description: "", quantity: 1, unit_price: 1 }]);
  };

  const handleRemoveBidItem = (idx: number) => {
    if (bidItems.length === 1) return;
    setBidItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof QuotationItemInput, val: any) => {
    setBidItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);
    
    // Validations
    if (!bidLeadTime || bidLeadTime <= 0) {
      setBidError("Lead time must be greater than 0");
      return;
    }
    
    const invalidItem = bidItems.some((item) => !item.item_description || item.quantity <= 0 || item.unit_price <= 0);
    if (invalidItem) {
      setBidError("Please fill in descriptions and positive numbers for all items");
      return;
    }

    setBidSubmitting(true);
    const formData = new FormData();
    formData.append("items", JSON.stringify(bidItems));
    formData.append("delivery_lead_time_days", String(bidLeadTime));
    formData.append("remarks", bidRemarks);
    if (bidFile) {
      formData.append("file", bidFile);
    }

    try {
      await api.post(`/api/rfqs/${id}/quotations`, formData, { isFormData: true });
      setBidSuccess("Quotation submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfq-detail", id] });
    } catch (err: any) {
      setBidError(err.message || "Failed to submit quotation");
    } finally {
      setBidSubmitting(false);
    }
  };

  // PO mutation
  const poMutation = useMutation({
    mutationFn: (payload: any) => api.post("/api/purchase-orders", payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setPoDialogOpen(false);
      navigate(`/purchase-orders/${data.id}`);
    },
    onError: (err: any) => {
      setPoError(err.message || "Failed to generate PO");
    },
  });

  const handleOpenPoDialog = (quoteId: number) => {
    setSelectedQuoteId(quoteId);
    setPoRemarks("");
    setPoError(null);
    setPoDialogOpen(true);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedQuoteId) return;
    poMutation.mutate({
      rfq_id: parseInt(id),
      quotation_id: selectedQuoteId,
      remarks: poRemarks,
    });
  };

  if (rfqLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (rfqError || !rfq) {
    return <Alert variant="destructive">Error loading RFQ: {rfqError?.message || "RFQ not found"}</Alert>;
  }

  const deadlineDate = new Date(rfq.deadline);
  const isExpired = deadlineDate < new Date();
  const bidTotalAmount = bidItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/rfqs"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <ChevronLeft size={14} /> Back to Sourcing listings
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-500 h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">{rfq.title}</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                RFQ Code: {rfq.rfq_number} • Published {new Date(rfq.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge
            variant={
              rfq.status === "OPEN" && !isExpired
                ? "success"
                : rfq.status === "CLOSED" || isExpired
                ? "danger"
                : rfq.status === "PROCESSED"
                ? "purple"
                : "secondary"
            }
          >
            {isExpired && rfq.status === "OPEN" ? "EXPIRED" : rfq.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFQ Meta Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Outline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {rfq.description || "No technical outline provided."}
              </div>

              {rfq.items && rfq.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
                    Line Items
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="text-xs font-semibold text-slate-400 uppercase bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-2 rounded-l-lg">Description</th>
                          <th className="px-4 py-2 w-24 rounded-r-lg text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfq.items.map((item: any) => (
                          <tr key={item.id} className="border-b border-slate-800/40 last:border-0">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 border-t border-slate-800/60 pt-4 text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Closing Date: {deadlineDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Deadline: {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sourcing Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle>Sourcing Specifications Files</CardTitle>
              <CardDescription>Upload/Download blueprint PDF sheets and drawings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rfq.documents && rfq.documents.length > 0 ? (
                <div className="space-y-2">
                  {rfq.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-lg hover:bg-slate-900/70 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-300">
                        <FileText size={15} className="text-indigo-400" />
                        <span className="font-semibold">{doc.file_name}</span>
                      </div>
                      <a
                        href={doc.file_url.startsWith("/") ? `http://localhost:5000${doc.file_url}` : doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                      >
                        Download Prospectus
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-xs py-2 text-center">No prospectus documents attached</div>
              )}

              {/* Upload form for procurement */}
              {isInternal && rfq.status === "OPEN" && (
                <form onSubmit={uploadDoc} className="border-t border-slate-800/60 pt-4 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Attach Technical Drawing
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded p-1.5 focus:outline-none"
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={docUploading} className="cursor-pointer">
                    <Upload size={14} className="mr-1.5" />
                    {docUploading ? "Attaching..." : "Upload File"}
                  </Button>
                </form>
              )}
              {docError && <Alert variant="destructive" className="mt-2">{docError}</Alert>}
            </CardContent>
          </Card>
        </div>

        {/* Action Panel Column */}
        <div className="lg:col-span-1">
          {/* VENDOR ACTIONS: Quotation Form */}
          {user?.role === "VENDOR" && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Commercial Proposal</CardTitle>
                <CardDescription>Submit itemized rates and lead times</CardDescription>
              </CardHeader>
              <CardContent>
                {rfq.status !== "OPEN" || isExpired ? (
                  <Alert variant="warning">
                    Sourcing for this RFQ is closed. Submissions are no longer accepted.
                  </Alert>
                ) : (
                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    {bidError && <Alert variant="destructive">{bidError}</Alert>}
                    {bidSuccess && <Alert variant="success">{bidSuccess}</Alert>}

                    {/* Itemized lines */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Quote Line Items
                        </span>
                        {(!rfq?.items || rfq.items.length === 0) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddBidItem}
                            className="px-2 py-1 h-fit text-xs border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                          >
                            <Plus size={12} className="mr-1" /> Add Item
                          </Button>
                        )}
                      </div>
                      
                      {bidItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900/35 border border-slate-800/80 rounded-lg space-y-2.5 animate-in fade-in-50 duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-indigo-400">#LINE {idx + 1}</span>
                            {(!rfq?.items || rfq.items.length === 0) && bidItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBidItem(idx)}
                                className="text-red-500 hover:text-red-400 p-0.5 rounded hover:bg-slate-800"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <Input
                            placeholder="Description (e.g. Laptop Core i7)"
                            value={item.item_description}
                            onChange={(e) => handleItemChange(idx, "item_description", e.target.value)}
                            required
                            disabled={!!rfq?.items?.length} // Disable editing if RFQ has predefined items
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              label="Qty"
                              placeholder="Quantity"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 0)}
                              min={1}
                              required
                              disabled={!!rfq?.items?.length} // Disable editing if RFQ has predefined items
                            />
                            <Input
                              type="number"
                              label="Rate (INR)"
                              placeholder="Price"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(idx, "unit_price", parseFloat(e.target.value) || 0)}
                              min={0.01}
                              step="any"
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-xs font-bold text-slate-300">
                      <span>Total Bid Value:</span>
                      <span className="text-indigo-400 text-sm">INR {bidTotalAmount.toLocaleString()}</span>
                    </div>

                    <Input
                      type="number"
                      label="Fulfillment Lead Time (Days) *"
                      value={bidLeadTime}
                      onChange={(e) => setBidLeadTime(parseInt(e.target.value) || 0)}
                      min={1}
                      required
                    />

                    <Textarea
                      label="Proposing Remarks"
                      placeholder="Remarks, discount factors, shipping notes..."
                      value={bidRemarks}
                      onChange={(e) => setBidRemarks(e.target.value)}
                      rows={2}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                        Prospectus Attachment (PDF)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setBidFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded p-1.5 focus:outline-none"
                      />
                    </div>

                    <Button type="submit" className="w-full cursor-pointer" disabled={bidSubmitting}>
                      {bidSubmitting ? "Submitting Bid..." : "Submit Proposal"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* INTERNAL ACTIONS: Received Bids List */}
          {isInternal && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <CardTitle>Suppliers Proposals</CardTitle>
                  <CardDescription>Bids received from invited suppliers</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {bids && bids.length > 0 && (
                  <Link to={`/rfqs/${id}/compare`} className="block w-full">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-1.5 cursor-pointer">
                      <TrendingUp size={15} /> Open Comparison Matrix
                    </Button>
                  </Link>
                )}

                {bidsLoading ? (
                  <div className="text-center py-4 text-slate-500 text-xs">Querying proposals...</div>
                ) : bids && bids.length > 0 ? (
                  <div className="space-y-3">
                    {bids.map((bid: any) => (
                      <div
                        key={bid.id}
                        className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-slate-700 transition-all space-y-2.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-200">
                              {bid.vendor?.company_name || "Supplier profile missing"}
                            </p>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                              Lead Time: {bid.delivery_lead_time_days} days
                            </span>
                          </div>
                          <Badge variant={bid.status === "ACCEPTED" ? "success" : "secondary"}>
                            {bid.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-xs">
                          <span className="font-semibold text-slate-400">INR {bid.total_price.toLocaleString()}</span>
                          {rfq.status === "OPEN" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenPoDialog(bid.id)}
                              className="px-2.5 py-1 text-[10px] h-fit cursor-pointer"
                            >
                              <FileCheck size={12} className="mr-1" />
                              Issue PO
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs py-4 text-center">No proposals received yet</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* PO Issuance Remarks Dialog */}
      <Dialog
        isOpen={poDialogOpen}
        onClose={() => setPoDialogOpen(false)}
        title="Confirm Purchase Order Issuance"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          {poError && <Alert variant="destructive">{poError}</Alert>}
          <p className="text-xs text-slate-400 leading-relaxed">
            By issuing this Purchase Order, you will award the contract to the selected supplier. This action marks the sourcing project as <strong className="text-indigo-400">PROCESSED</strong> and locks the contract price.
          </p>
          <Textarea
            label="Administrative Remarks / Notes"
            placeholder="Add any logistics instructions or references..."
            value={poRemarks}
            onChange={(e) => setPoRemarks(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
            <Button type="button" variant="outline" onClick={() => setPoDialogOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={poMutation.isPending}
              className="cursor-pointer"
            >
              {poMutation.isPending ? "Generating PO..." : "Issue Purchase Order"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default RFQDetail;
