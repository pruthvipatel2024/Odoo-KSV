import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Info, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";

export const RFQCreate: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1 }]);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch APPROVED vendors to assign
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors-approved"],
    queryFn: () => api.get("/api/vendors?status=APPROVED"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/api/rfqs", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      navigate("/rfqs");
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create RFQ");
    },
  });

  const handleVendorToggle = (vendorId: number) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleSelectAllVendors = () => {
    if (!vendors) return;
    if (selectedVendors.length === vendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(vendors.map((v: any) => v.id));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !deadline) {
      setError("RFQ Title and Deadline are required fields");
      return;
    }

    if (selectedVendors.length === 0) {
      setError("Please assign this RFQ to at least one vendor");
      return;
    }

    if (items.length === 0 || items.some(item => !item.description || item.quantity < 1)) {
      setError("Please add at least one item with a valid description and quantity");
      return;
    }

    // Parse date and construct ISO payload
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      setError("Deadline must be a future date and time");
      return;
    }

    createMutation.mutate({
      title,
      description,
      deadline: deadlineDate.toISOString(),
      vendor_ids: selectedVendors,
      items: items.map(i => ({ ...i, quantity: Number(i.quantity) })),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/rfqs"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <ChevronLeft size={14} /> Back to Sourcing listings
        </Link>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Create Sourcing RFQ</h2>
        <p className="text-sm text-slate-400">
          Prepare technical specifications and invite approved suppliers to submit commercial proposals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="destructive">{error}</Alert>}

        <Card>
          <CardHeader>
            <CardTitle>RFQ Specifications</CardTitle>
            <CardDescription>Enter technical outlines and deadlines for proposal submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Sourcing Project Title *"
              placeholder="e.g. Procurement of High-Grade Steel Structural Tubes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label="Sourcing Description / Bill of Quantities"
              placeholder="List quantities, delivery conditions, and exact spec details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <Input
              label="Proposal Submission Deadline *"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />

            <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                Line Items
              </h4>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-900/30 p-3 rounded-md border border-slate-800">
                  <div className="flex-1">
                    <Input
                      label="Item Description *"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label="Qty *"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      required
                    />
                  </div>
                  <div className="pt-5">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="cursor-pointer px-3"
                    >
                      X
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="cursor-pointer mt-2">
                + Add Line Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Selection */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <CardTitle>Supplier Allocations</CardTitle>
                <CardDescription>Select approved suppliers from directory to invite for bidding</CardDescription>
              </div>
              {vendors && vendors.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllVendors}
                  className="cursor-pointer"
                >
                  {selectedVendors.length === vendors.length ? "Deselect All" : "Select All Approved"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {vendorsLoading ? (
              <div className="text-center py-4 text-slate-500">Querying active suppliers...</div>
            ) : vendors && vendors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {vendors.map((vendor: any) => {
                  const isChecked = selectedVendors.includes(vendor.id);
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => handleVendorToggle(vendor.id)}
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-900/40 transition-all cursor-pointer ${
                        isChecked
                          ? "border-indigo-500/80 bg-indigo-950/10"
                          : "border-slate-800 bg-slate-950/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled via parent onClick
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{vendor.company_name}</p>
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{vendor.gst_number}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500 text-xs border border-amber-900/40 p-4 rounded-lg bg-amber-950/10">
                <Info size={16} />
                <span>No approved vendors are currently available in the database. Please verify and approve suppliers first.</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between border-t border-slate-800/40 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold">
              <Users size={15} />
              <span>{selectedVendors.length} Supplier(s) Selected</span>
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || !vendors || vendors.length === 0}
              className="cursor-pointer"
            >
              {createMutation.isPending ? "Creating Listing..." : "Publish RFQ"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
export default RFQCreate;
