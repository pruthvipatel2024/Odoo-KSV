import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { ChevronLeft, Star, TrendingDown, Clock, ShieldCheck, DollarSign, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
import { Dialog } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";

export const RFQCompare: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [poRemarks, setPoRemarks] = useState("");
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poError, setPoError] = useState<string | null>(null);

  // Fetch Sourcing Matrix comparison
  const { data: matrix, isLoading, error } = useQuery({
    queryKey: ["rfq-compare", id],
    queryFn: () => api.get(`/api/rfqs/${id}/compare`),
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !matrix) {
    return <Alert variant="destructive">Error loading comparison: {error?.message}</Alert>;
  }

  const { rfq, quotations } = matrix;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to={`/rfqs/${id}`}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <ChevronLeft size={14} /> Back to RFQ #{rfq.rfq_number} details
        </Link>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Quotations Comparison Board</h2>
        <p className="text-sm text-slate-400">
          Compare item prices, delivery lead times, and vendor metrics side-by-side.
        </p>
      </div>

      {rfq.status !== "OPEN" && (
        <Alert variant="warning">
          This RFQ is currently in <strong className="uppercase">{rfq.status}</strong> status. Bidding has closed.
        </Alert>
      )}

      {quotations && quotations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {quotations.map((q: any) => {
            // Apply highlight styling borders
            let cardBorder = "border-slate-800";
            if (q.is_lowest_price) cardBorder = "border-emerald-500 ring-2 ring-emerald-950/40 bg-emerald-950/5";
            else if (q.is_fastest_delivery) cardBorder = "border-sky-500 ring-2 ring-sky-950/40 bg-sky-950/5";

            return (
              <Card
                key={q.id}
                className={`flex flex-col hover-lift relative ${cardBorder}`}
              >
                {/* Badges indicators */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  {q.is_lowest_price && (
                    <Badge variant="success" className="text-[9px] uppercase tracking-wider font-extrabold shadow">
                      Lowest Price
                    </Badge>
                  )}
                  {q.is_fastest_delivery && (
                    <Badge variant="info" className="text-[9px] uppercase tracking-wider font-extrabold shadow">
                      Fastest Lead Time
                    </Badge>
                  )}
                  {q.is_best_rated && (
                    <Badge variant="purple" className="text-[9px] uppercase tracking-wider font-extrabold shadow">
                      Top Rated
                    </Badge>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="pr-20 text-sm truncate">{q.vendor_name}</CardTitle>
                  <CardDescription className="text-[10px] font-mono mt-0.5">
                    GST: {q.vendor?.gst_number || "N/A"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 text-xs">
                  {/* Financial KPI stats */}
                  <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-3">
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Bid Total
                      </p>
                      <p className="text-sm font-black text-slate-100 mt-1">
                        INR {q.total_price.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Lead Time
                      </p>
                      <p className="text-sm font-black text-slate-100 mt-1">
                        {q.delivery_lead_time_days} Days
                      </p>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-slate-400 font-medium">Quality Rating</span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                      <Star size={13} fill="currentColor" />
                      <span>{q.vendor_rating.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Itemized pricing breakdown */}
                  <div>
                    <h5 className="font-bold text-indigo-400 text-[10px] uppercase tracking-wider mb-2">
                      Itemized Breakdown
                    </h5>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {q.items && q.items.length > 0 ? (
                        q.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start py-1 border-b border-slate-900 text-[11px]"
                          >
                            <span className="text-slate-300 font-medium flex-1 truncate pr-2">
                              {item.item_description} <span className="text-slate-500 font-mono text-[9px]">x{item.quantity}</span>
                            </span>
                            <span className="text-slate-400 font-semibold shrink-0">
                              INR {(item.quantity * item.unit_price).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 italic">No lines detailed</p>
                      )}
                    </div>
                  </div>

                  {/* Remarks */}
                  {q.remarks && (
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] text-slate-400 italic leading-relaxed">
                      <strong>Remarks:</strong> {q.remarks}
                    </div>
                  )}
                </CardContent>

                {/* Confirm award contract buttons */}
                {rfq.status === "OPEN" && (
                  <CardFooter className="pt-3 border-t border-slate-850">
                    <Button
                      variant={q.is_lowest_price ? "primary" : "outline"}
                      className="w-full cursor-pointer"
                      onClick={() => handleOpenPoDialog(q.id)}
                    >
                      <ShieldCheck size={14} className="mr-1.5" /> Award Sourcing Contract
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-slate-400">No quotation proposals have been submitted for this RFQ yet.</p>
            <Link to={`/rfqs/${id}`} className="inline-block mt-3 text-indigo-400 font-semibold hover:underline">
              Back to Technical Specifications
            </Link>
          </CardContent>
        </Card>
      )}

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
export default RFQCompare;
