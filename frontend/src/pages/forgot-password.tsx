import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { Building, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";

export const ForgotPassword: React.FC = () => {
  const api = useApi();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess("If the email is valid, a password reset token has been dispatched.");
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
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

      <Card className="max-w-md w-full glassmorphic border border-slate-800 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-center">Reset Security Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email to request a secure reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="relative">
              <Mail className="absolute left-3 top-9 text-slate-500 h-4 w-4" />
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2 cursor-pointer" disabled={loading}>
              {loading ? "Submitting..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-slate-400 text-center w-full">
            Remember your credentials?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Back to Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
export default ForgotPassword;
