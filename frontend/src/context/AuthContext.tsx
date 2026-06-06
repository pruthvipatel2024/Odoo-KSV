import React, { createContext, useState, useEffect } from "react";

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "PROCUREMENT" | "MANAGER" | "VENDOR";
  is_active: boolean;
  vendor_id?: number;
  vendor_status?: "PENDING" | "APPROVED" | "REJECTED" | "BLACKLISTED";
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("vendorbridge_token");
    const storedUser = localStorage.getItem("vendorbridge_user");
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("vendorbridge_token");
        localStorage.removeItem("vendorbridge_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem("vendorbridge_token", newToken);
    localStorage.setItem("vendorbridge_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("vendorbridge_token");
    localStorage.removeItem("vendorbridge_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
