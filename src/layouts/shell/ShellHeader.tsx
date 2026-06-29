import { ArrowLeft, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';
import SMSNotificationBadge from '@/components/SMSNotificationBadge';
import { ShellIconButton } from './ShellIconButton';

interface ShellHeaderProps {
  title?: string;
  showBackToAdmin?: boolean;
  onSignOut?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

/** Toolbar inside the white content card (Taskapp-style). */
export function ShellHeader({
  title = 'Dashboard',
  showBackToAdmin,
  onSignOut,
  onMenuClick,
  showMenuButton = false,
}: ShellHeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'flex shrink-0 items-center gap-2 border-b border-black/5 px-4 py-3 max-md:gap-2',
        'pt-[max(12px,env(safe-area-inset-top))] md:gap-2.5 md:px-[22px] md:py-4 md:pt-[max(16px,env(safe-area-inset-top))]',
      )}
    >
      {showMenuButton && (
        <ShellIconButton onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </ShellIconButton>
      )}

      {showBackToAdmin && (
        <ShellIconButton onClick={() => navigate('/dashboard')} aria-label="Back to admin">
          <ArrowLeft size={18} />
        </ShellIconButton>
      )}

      <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold tracking-tight text-shell-muted md:text-[15px]">
        {title}
      </div>

      <div className="flex shrink-0 items-center gap-1 [&_.text-white]:!text-shell-muted [&_button[class*='hover:bg-white']:hover]:!bg-black/5">
        <SMSNotificationBadge />
        <NotificationBell />
        {onSignOut && (
          <ShellIconButton onClick={onSignOut} aria-label="Sign out">
            <LogOut size={17} />
          </ShellIconButton>
        )}
      </div>
    </header>
  );
}
