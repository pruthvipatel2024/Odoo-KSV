import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { Star, Building, Phone, Mail, MapPin, ChevronLeft, FileText, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";

export const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const api = useApi();

  // Fetch Vendor Profile
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ["vendor-detail", id],
    queryFn: () => api.get(`/api/vendors/${id}`),
    enabled: !!id,
  });

  // Fetch Vendor Bids
  const { data: bids, isLoading: bidsLoading } = useQuery({
    queryKey: ["vendor-bids", id],
    queryFn: () => api.get(`/api/quotations?vendor_id=${vendor?.id}`),
    enabled: !!vendor?.id,
  });

  // Fetch Vendor POs
  const { data: pos, isLoading: posLoading } = useQuery({
    queryKey: ["vendor-pos", id],
    queryFn: () => api.get(`/api/purchase-orders?vendor_id=${vendor?.id}`),
    enabled: !!vendor?.id,
  });

  // Fetch Vendor Invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["vendor-invoices", id],
    queryFn: () => api.get(`/api/invoices?vendor_id=${vendor?.id}`),
    enabled: !!vendor?.id,
  });

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (vendorError || !vendor) {
    return <Alert variant="destructive">Error: {vendorError?.message || "Vendor profile not found"}</Alert>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/vendors"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <ChevronLeft size={14} /> Back to Suppliers Directory
        </Link>
        <div className="flex items-center gap-3">
          <Building className="text-indigo-500 h-8 w-8 shrink-0" />
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              {vendor.company_name}
            </h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Supplier ID: {vendor.id} • Registered {new Date(vendor.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Supplier Profile</CardTitle>
            <CardDescription>Corporate credentials and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Status & Rating */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-400 font-medium">Verify Status</span>
              <Badge
                variant={
                  vendor.status === "APPROVED"
                    ? "success"
                    : vendor.status === "PENDING"
                    ? "warning"
                    : "danger"
                }
              >
                {vendor.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-400 font-medium">GST Identification</span>
              <span className="font-mono font-bold text-slate-200">{vendor.gst_number}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-400 font-medium">Quality Rating</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star size={13} fill="currentColor" />
                <span>{vendor.rating.toFixed(2)} / 5.00</span>
              </div>
            </div>

            {/* Direct contact */}
            <div className="space-y-3 pt-1">
              <div className="flex gap-2">
                <Mail className="text-slate-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    Corporate Email
                  </p>
                  <a href={`mailto:${vendor.contact_email}`} className="text-indigo-400 hover:underline">
                    {vendor.contact_email}
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Phone className="text-slate-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    Telephone Phone
                  </p>
                  <span className="text-slate-200">{vendor.contact_phone || "N/A"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="text-slate-500 shrink-0" size={16} />
                <div>
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    Registered Address
                  </p>
                  <span className="text-slate-300 leading-relaxed">{vendor.address || "N/A"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="bids">
            <CardHeader className="p-0 border-none">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle>Transaction Ledger</CardTitle>
                  <CardDescription>Consolidated ledger of bids, POs, and invoices</CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="bids">Quotations ({bids?.length || 0})</TabsTrigger>
                  <TabsTrigger value="pos">POs ({pos?.length || 0})</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices ({invoices?.length || 0})</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {/* Submitted Bids Tab */}
              <TabsContent value="bids">
                {bidsLoading ? (
                  <div className="text-center py-4 text-slate-500">Loading bid history...</div>
                ) : bids && bids.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>RFQ Reference</TableHead>
                        <TableHead>Bid Amount</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Bid Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.map((bid: any) => (
                        <TableRow key={bid.id}>
                          <TableCell className="font-semibold text-slate-200">
                            RFQ #{bid.rfq_id}
                          </TableCell>
                          <TableCell className="font-medium text-slate-200">
                            INR {bid.total_price.toLocaleString()}
                          </TableCell>
                          <TableCell>{bid.delivery_lead_time_days} days</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                bid.status === "ACCEPTED"
                                  ? "success"
                                  : bid.status === "REJECTED"
                                  ? "danger"
                                  : "info"
                              }
                            >
                              {bid.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              to={`/rfqs/${bid.rfq_id}`}
                              className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold gap-1"
                            >
                              View RFQ <ArrowRight size={12} />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-slate-500">No quotation history recorded</div>
                )}
              </TabsContent>

              {/* Awarded POs Tab */}
              <TabsContent value="pos">
                {posLoading ? (
                  <div className="text-center py-4 text-slate-500">Loading purchase orders...</div>
                ) : pos && pos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Award Value</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Fulfillment State</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pos.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs text-slate-200">{po.po_number}</TableCell>
                          <TableCell className="font-semibold text-slate-200">
                            INR {po.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
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
                            <Link
                              to={`/purchase-orders/${po.id}`}
                              className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold gap-1"
                            >
                              Details <ArrowRight size={12} />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-slate-500">No purchase orders awarded</div>
                )}
              </TabsContent>

              {/* Financial Invoices Tab */}
              <TabsContent value="invoices">
                {invoicesLoading ? (
                  <div className="text-center py-4 text-slate-500">Loading invoice entries...</div>
                ) : invoices && invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Billing Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs text-slate-200">{inv.invoice_number}</TableCell>
                          <TableCell>{new Date(inv.invoice_date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-semibold text-slate-200">
                            INR {inv.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={inv.status === "PAID" ? "success" : "warning"}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              to={`/invoices/${inv.id}`}
                              className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold gap-1"
                            >
                              Invoice <ArrowRight size={12} />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-slate-500">No tax invoices recorded</div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
export default VendorDetail;
