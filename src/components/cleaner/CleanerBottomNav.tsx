import { Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CleanerBottomNav = () => {
  const navItems = [
    {
      label: 'Upcoming',
      icon: Calendar,
      path: '/cleaner-upcoming-bookings',
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
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default CleanerBottomNav;
