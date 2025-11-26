import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Brain, FileSpreadsheet, UserPlus, LogOut, User, Shield, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/types";

const baseNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER] },
  { href: "/model", label: "Model", icon: Brain, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER] },
  { href: "/prediksi", label: "Prediksi", icon: FileSpreadsheet, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER] },
  { href: "/register", label: "Users", icon: UserPlus, roles: [UserRole.SUPER_ADMIN] },
];

const roleIcons: Record<UserRole, React.ReactNode> = {
  [UserRole.SUPER_ADMIN]: <ShieldAlert className="h-4 w-4 text-red-500" />,
  [UserRole.ADMIN]: <Shield className="h-4 w-4 text-amber-500" />,
  [UserRole.USER]: <User className="h-4 w-4 text-blue-500" />,
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Admin",
  [UserRole.ADMIN]: "Admin",
  [UserRole.USER]: "User",
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter nav items based on user role
  const navItems = baseNavItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-white font-bold text-lg shadow-lg shadow-primary/30">
              C
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">CART Prediction</h1>
              <p className="text-xs text-muted-foreground">Siswa Berprestasi</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 px-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-600 text-white text-xs font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2">
                    {roleIcons[user.role]}
                    <span>{roleLabels[user.role]}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Metode CART untuk Menentukan Siswa Berprestasi</p>
          <p className="mt-1">SMP PGRI Tambun Selatan</p>
        </div>
      </footer>
    </div>
  );
}

