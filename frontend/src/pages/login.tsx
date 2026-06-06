import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { Building, Lock, Mail } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const api = useApi();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await api.post("/api/auth/login", { email, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-6 text-slate-100 animate-fade-in">
        <Building className="text-indigo-500 h-8 w-8" />
        <span className="font-extrabold text-2xl tracking-wider uppercase">
          VendorBridge
        </span>
      </div>

      <Card className="max-w-md w-full glassmorphic border border-slate-800 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-center">ERP Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your procurement portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}
            
            <div className="relative">
              <Mail className="absolute left-3 top-9 text-slate-500 h-4 w-4" />
              <Input
                label="Corporate Email Address"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-9 text-slate-500 h-4 w-4" />
              <Input
                label="Security Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full mt-2 cursor-pointer" disabled={loading}>
              {loading ? "Verifying Session..." : "Secure Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-xs text-slate-400 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
export default Login;
