import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Building2, Calendar, ClipboardList, LogOut, Shield } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NavLink } from 'react-router-dom';
import ProfileSettings from '@/components/ProfileSettings';
import { cn } from '@/lib/utils';
import { User as UserIcon, Settings } from 'lucide-react';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, profile, isAdmin, loading, signOut } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;

  const navItems = [
    { to: '/', icon: Calendar, label: 'Dashboard' },
    { to: '/my-bookings', icon: ClipboardList, label: 'My Bookings' },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin Panel' }] : []),
  ];

  return (
    <div 
      className="min-h-screen flex bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: 'url("/bg.png")' }}
    >
      <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[-1]"></div>

      {/* Sidebar */}
      <aside className="w-64 bg-sidebar/90 backdrop-blur-md text-sidebar-foreground flex flex-col fixed h-full z-10 border-r border-border/20 shadow-xl">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg">Conference Room Booking</span>
        </div>

        <div className="p-4 mx-2 mt-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted border border-white/10 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 opacity-40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-bold">{profile?.department}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-1">
          <ProfileSettings trigger={
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full rounded-lg hover:bg-sidebar-accent/50">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          } />
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full rounded-lg hover:bg-sidebar-accent/50"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col z-10">
        <header className="flex items-center justify-end px-6 py-3 border-b border-border/10 bg-card/60 backdrop-blur-md gap-3">
          <ThemeToggle />
          <NotificationBell />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
