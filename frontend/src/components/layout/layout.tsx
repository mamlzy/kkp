import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  FileSpreadsheet,
  UserPlus,
  LogOut,
  User,
  Shield,
  ShieldAlert,
  Pencil,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@/types';
import { EditProfileDialog } from '@/components/dialogs/edit-profile-dialog';

const baseNavItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
  },
  {
    href: '/model',
    label: 'Model',
    icon: Brain,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
  },
  {
    href: '/prediksi',
    label: 'Prediksi',
    icon: FileSpreadsheet,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
  },
  {
    href: '/register',
    label: 'Users',
    icon: UserPlus,
    roles: [UserRole.SUPER_ADMIN],
  },
];

const roleIcons: Record<UserRole, React.ReactNode> = {
  [UserRole.SUPER_ADMIN]: <ShieldAlert className='h-4 w-4 text-red-500' />,
  [UserRole.ADMIN]: <Shield className='h-4 w-4 text-amber-500' />,
  [UserRole.USER]: <User className='h-4 w-4 text-blue-500' />,
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.USER]: 'User',
};

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter nav items based on user role
  const navItems = baseNavItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <div className='min-h-screen grid bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'>
      {/* Header */}
      <div>
        <header className='sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md'>
          <div className='container flex h-16 items-center justify-between px-4'>
            {/* Logo */}
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-white font-bold text-lg shadow-lg shadow-primary/30'>
                <GraduationCap className='h-6 w-6' />
              </div>
              <div className='hidden sm:block'>
                <h1 className='font-bold text-lg leading-tight'>SIPRESTA</h1>
                <p className='text-xs text-muted-foreground'>
                  Sistem Prediksi Prestasi Siswa
                </p>
              </div>
              <div className='sm:hidden'>
                <h1 className='font-bold text-base leading-tight'>SIPRESTA</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className='hidden lg:flex items-center gap-4'>
              <nav className='flex items-center gap-1'>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <item.icon className='h-4 w-4' />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='flex items-center gap-2 px-3 group'
                    >
                      <div className='flex h-7 w-7 items-center justify-center group-hover:bg-white rounded-full bg-primary text-white group-hover:text-primary text-xs font-semibold'>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className='hidden xl:inline  text-sm font-medium'>
                        {user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    <DropdownMenuLabel>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium'>{user.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          @{user.username}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className='flex items-center gap-2 font-normal'>
                      {roleIcons[user.role]}
                      <span>{roleLabels[user.role]}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsEditProfileOpen(true)}
                      className='flex items-center gap-2'
                    >
                      <Pencil className='h-4 w-4' />
                      <span>Edit Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className='flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50'
                    >
                      <LogOut className='h-4 w-4' />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className='flex lg:hidden items-center gap-2'>
              {user && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className='h-10 w-10'
                >
                  {isMobileMenuOpen ? (
                    <X className='h-5 w-5' />
                  ) : (
                    <Menu className='h-5 w-5' />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className='lg:hidden border-t bg-white/95 backdrop-blur-md'>
              <nav className='container px-4 py-4 flex flex-col gap-2'>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <item.icon className='h-5 w-5' />
                      {item.label}
                    </Link>
                  );
                })}
                {user && (
                  <>
                    <div className='my-2 border-t' />
                    <div className='px-4 py-2'>
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-600 text-white text-sm font-semibold'>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className='text-sm font-medium'>{user.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground mb-3'>
                        {roleIcons[user.role]}
                        <span>{roleLabels[user.role]}</span>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setIsEditProfileOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className='flex items-center gap-2 justify-start px-4 py-3 h-auto'
                    >
                      <Pencil className='h-4 w-4' />
                      <span>Edit Profil</span>
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className='flex items-center gap-2 justify-start px-4 py-3 h-auto text-red-600 hover:text-red-600 hover:bg-red-50 border-red-200'
                    >
                      <LogOut className='h-4 w-4' />
                      <span>Keluar</span>
                    </Button>
                  </>
                )}
              </nav>
            </div>
          )}
        </header>

        {/* Edit Profile Dialog */}
        {user && (
          <EditProfileDialog
            open={isEditProfileOpen}
            onOpenChange={setIsEditProfileOpen}
          />
        )}

        {/* Main Content */}
        <main className='container px-4 py-8'>{children}</main>
      </div>

      {/* Footer */}
      <footer className='border-t self-end bg-white/50 py-4'>
        <div className='container px-4 text-center text-sm text-muted-foreground'>
          <p className='mt-1'>SMP PGRI Tambun Selatan</p>
        </div>
      </footer>
    </div>
  );
}
