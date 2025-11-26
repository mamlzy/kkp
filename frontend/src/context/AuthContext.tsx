import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  verifyToken,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "@/lib/api";
import type { User, LoginRequest, UserRole } from "@/types";
import { PERMISSIONS } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  // Permission helpers
  canAccessRegister: boolean;
  canCreateModel: boolean;
  canDeleteModel: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const userData = await verifyToken();
          setUser(userData);
        } catch {
          // Token is invalid or expired
          clearStoredToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data);
    setStoredToken(response.access_token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  // Compute permissions based on user role
  const role = user?.role as UserRole | undefined;
  const canAccessRegister = role ? PERMISSIONS.canAccessRegister(role) : false;
  const canCreateModel = role ? PERMISSIONS.canCreateModel(role) : false;
  const canDeleteModel = role ? PERMISSIONS.canDeleteModel(role) : false;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    canAccessRegister,
    canCreateModel,
    canDeleteModel,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

