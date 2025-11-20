import { Calendar, DollarSign, User, Briefcase } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import { cn } from '@/lib/utils';
import SyncStatusBadge from './SyncStatusBadge';

const CleanerBottomNav = () => {
  const { data: availableCount } = useAvailableBookingsCount();

  const navItems = [
    {
      label: 'Today',
      icon: Briefcase,
      path: '/cleaner-today',
    },
    {
      label: 'Bookings',
      icon: Calendar,
      path: '/cleaner-bookings',
      badge: availableCount && availableCount > 0 ? availableCount : undefined,
    },
    {
      label: 'Earnings',
      icon: DollarSign,
      path: '/cleaner-earnings',
    },
    {
      label: 'Account',
      icon: User,
      path: '/cleaner-settings',
    },
  ];

  return (
    <>
      {/* Sync Status Badge - floating above nav */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-40 px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <SyncStatusBadge />
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
              {item.badge && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
        </div>
      </nav>
    </>
  );
};

export default CleanerBottomNav;
