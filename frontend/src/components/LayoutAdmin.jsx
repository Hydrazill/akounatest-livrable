import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  User,
  LogOut,
  BarChart3,
  Users,
  UtensilsCrossed,
  TableProperties,
  Package,
} from 'lucide-react';
import { useAuthStore } from '../lib/store.js';

const LayoutAdmin = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/commandes', label: 'Commandes', icon: Package },
    { href: '/admin/tables', label: 'Tables', icon: TableProperties },
    { href: '/admin/menus', label: 'Menus', icon: UtensilsCrossed },
    { href: '/admin/plats', label: 'Plats', icon: Menu },
    { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  ];

  const NavLink = ({ href, label, icon: Icon, mobile = false }) => {
    const isActive = location.pathname === href;
    const baseClasses = mobile
      ? "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary"
      : "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:text-primary";
    
    const activeClasses = isActive ? "bg-muted text-primary" : "";

    return (
      <Link
        to={href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold foodHive-text-gradient">
              <UtensilsCrossed className="h-6 w-6" color='white' />
              <span>FOODHIVE</span>
            </Link>
          </div>
          <div className="flex-1 bg-secondary-foreground">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {adminNavItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b text-foreground bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UtensilsCrossed className="h-6 w-6" />
                  <span>FOODHIVE</span>
                </Link>
                {adminNavItems.map((item) => (
                  <NavLink key={item.href} {...item} mobile />
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            <h1 className="text-lg text-primary-foreground font-semibold md:text-2xl">
              {user?.role === 'admin' ? 'Administration' : 'Restaurant'}
            </h1>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user ? getInitials(user.nom) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.nom}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/profil" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;