import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { Building, User, Mail, Lock, Landmark } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";

export const Register: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "VENDOR",
    company_name: "",
    gst_number: "",
    category: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validations
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError("Please fill in all required user fields");
      return;
    }

    if (formData.role === "VENDOR") {
      if (!formData.company_name || !formData.gst_number || !formData.category) {
        setError("Company Name, GST Number, and Category are required for vendor registration");
        return;
      }
      if (formData.gst_number.length !== 15) {
        setError("GST Number must be exactly 15 characters");
        return;
      }
    }

    setLoading(true);

    try {
      await api.post("/api/auth/register", formData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      // Parse validation error dict or string msg
      try {
        const parsed = JSON.parse(err.message);
        if (typeof parsed === "object") {
          setError(Object.values(parsed).flat().join(", "));
          return;
        }
      } catch (e) {}
      setError(err.message || "Failed to register. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="flex items-center gap-2.5 mb-6 text-slate-100">
        <Building className="text-indigo-500 h-8 w-8" />
        <span className="font-extrabold text-2xl tracking-wider uppercase">
          VendorBridge
        </span>
      </div>

      <Card className="max-w-lg w-full glassmorphic border border-slate-800 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-center">Create Corporate Account</CardTitle>
          <CardDescription className="text-center">
            Register to join the VendorBridge ERP ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name *"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Corporate Email Address *"
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password *"
              type="password"
              name="password"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Select
              label="Corporate Role *"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: "VENDOR", label: "Vendor Representative" },
                { value: "PROCUREMENT", label: "Procurement Officer" },
                { value: "MANAGER", label: "Procurement Manager" },
                { value: "ADMIN", label: "System Administrator" },
              ]}
            />

            {formData.role === "VENDOR" && (
              <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  Company Verification Details
                </h4>
                <Input
                  label="Registered Company Name *"
                  name="company_name"
                  placeholder="e.g. Acme Industries Ltd"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="GST Identification Number (GSTIN) *"
                  name="gst_number"
                  placeholder="15-digit alphanumeric (e.g. 27AAAAA1111A1Z1)"
                  value={formData.gst_number}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="Vendor Category *"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Select Category" },
                    { value: "IT & Software", label: "IT & Software" },
                    { value: "Hardware & Electronics", label: "Hardware & Electronics" },
                    { value: "Office Supplies", label: "Office Supplies" },
                    { value: "Consulting", label: "Consulting" },
                    { value: "Logistics", label: "Logistics" },
                    { value: "Manufacturing", label: "Manufacturing" },
                    { value: "Other", label: "Other" }
                  ]}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full mt-4 cursor-pointer" disabled={loading}>
              {loading ? "Creating Account..." : "Register Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-slate-400 text-center w-full">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
export default Register;
