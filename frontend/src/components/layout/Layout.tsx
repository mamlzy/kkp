import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Brain, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/model", label: "Model", icon: Brain },
  { href: "/prediksi", label: "Prediksi", icon: FileSpreadsheet },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

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

