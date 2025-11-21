import { Bell, User, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTodayBookingsCount } from '@/hooks/useTodayBookingsCount';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SyncStatusBadge from './SyncStatusBadge';
import { cn } from '@/lib/utils';

export default function CleanerTopNav() {
  const { data: todayCount } = useTodayBookingsCount();
  const { data: availableCount } = useAvailableBookingsCount();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50">
      <div className="flex items-center justify-between px-4 h-full max-w-screen-xl mx-auto">
        {/* Left: Today & Available badges */}
        <div className="flex items-center gap-2">
          {todayCount && todayCount > 0 && (
            <Link to="/cleaner-today">
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span className="font-medium">Today: {todayCount}</span>
              </Badge>
            </Link>
          )}
          
          {availableCount && availableCount > 0 && (
            <Link to="/cleaner-available-bookings">
              <Badge
                variant="default"
                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="font-medium">{availableCount} Job{availableCount !== 1 ? 's' : ''}</span>
              </Badge>
            </Link>
          )}
        </div>

        {/* Center: Sync status */}
        <div className="flex-1 flex justify-center">
          <SyncStatusBadge />
        </div>

        {/* Right: Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/cleaner-settings')}>
              <User className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
