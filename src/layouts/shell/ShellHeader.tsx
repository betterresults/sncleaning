import { ArrowLeft, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';
import SMSNotificationBadge from '@/components/SMSNotificationBadge';

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
    <header className="shell-card-header">
      {showMenuButton && (
        <button type="button" className="shell-icon-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
      )}

      {showBackToAdmin && (
        <button type="button" className="shell-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Back to admin">
          <ArrowLeft size={18} />
        </button>
      )}

      <div className="shell-card-title">{title}</div>

      <div className="shell-card-actions">
        <SMSNotificationBadge />
        <NotificationBell />
        {onSignOut && (
          <button type="button" className="shell-icon-btn" onClick={onSignOut} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
