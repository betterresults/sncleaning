import { Calendar, DollarSign, CheckCircle, Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';

const CleanerBottomNav = () => {
  const { data: availableCount } = useAvailableBookingsCount();

  const navItems = [
    {
      label: 'Upcoming',
      icon: Calendar,
      path: '/cleaner-upcoming-bookings',
    },
    {
      label: 'Available',
      icon: Bell,
      path: '/cleaner-available-bookings',
      badge: availableCount,
    },
    {
      label: 'Completed',
      icon: CheckCircle,
      path: '/cleaner-completed-bookings',
    },
    {
      label: 'Earnings',
      icon: DollarSign,
      path: '/cleaner-earnings',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default CleanerBottomNav;
