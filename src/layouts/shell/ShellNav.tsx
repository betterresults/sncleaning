import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import type { ShellNavigationItem } from './types';

interface ShellNavProps {
  items: ShellNavigationItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function ShellNav({ items, collapsed = false, onNavigate }: ShellNavProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [flyout, setFlyout] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const { data: availableCount } = useAvailableBookingsCount();

  const flatItems = items.filter((i) => !i.subItems?.length);
  const moduleItems = items.filter((i) => i.subItems?.length);

  useEffect(() => {
    if (!flyout) return;
    const close = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyout(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [flyout]);

  useEffect(() => {
    if (!collapsed) setFlyout(null);
  }, [collapsed]);

  const toggle = (title: string) => {
    setExpanded((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const linkClass = (active: boolean, disabled?: boolean) => {
    let c = 'shell-nav-link';
    if (active) c += ' shell-nav-link--active';
    if (disabled) c += ' shell-nav-link--disabled';
    if (collapsed) c += ' shell-nav-link--collapsed';
    return c;
  };

  const wrapTooltip = (label: string, node: ReactNode) => {
    if (!collapsed) return node;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderFlat = (item: ShellNavigationItem) => {
    const active = Boolean(item.url && location.pathname === item.url && !item.disabled);

    if (item.disabled) {
      const node = (
        <div key={item.title} className={linkClass(false, true)}>
          <item.icon />
          <span className="shell-nav-text">{item.title}</span>
        </div>
      );
      return wrapTooltip(item.title, node);
    }

    const showBadge =
      item.showCount &&
      item.countKey === 'available-bookings-count' &&
      availableCount &&
      availableCount > 0;

    const node = (
      <Link key={item.title} to={item.url!} className={linkClass(active)} onClick={onNavigate}>
        <span className="shell-nav-icon-wrap">
          <item.icon />
          {showBadge && collapsed && (
            <span className="shell-nav-dot" aria-label={`${availableCount} available`} />
          )}
        </span>
        <span className="shell-nav-text">{item.title}</span>
        {showBadge && !collapsed && <span className="shell-nav-badge">{availableCount}</span>}
      </Link>
    );

    return wrapTooltip(item.title, node);
  };

  const renderModule = (item: ShellNavigationItem) => {
    const isOpen = expanded.includes(item.title);
    const subActive = item.subItems?.some((s) => location.pathname === s.url);
    const flyoutOpen = flyout === item.title;

    if (collapsed) {
      const node = (
        <button
          type="button"
          key={item.title}
          className={`${linkClass(!!subActive)} shell-nav-link--flyout-trigger`}
          onClick={() => setFlyout(flyoutOpen ? null : item.title)}
          aria-expanded={flyoutOpen}
          aria-haspopup="true"
        >
          <item.icon />
          <span className="shell-nav-text">{item.title}</span>
        </button>
      );

      return (
        <div key={item.title} className="shell-nav-flyout-anchor">
          {wrapTooltip(item.title, node)}
          {flyoutOpen && (
            <div ref={flyoutRef} className="shell-nav-flyout" role="menu">
              <div className="shell-nav-flyout-title">{item.title}</div>
              {item.subItems?.map((sub) => (
                <Link
                  key={sub.title}
                  to={sub.url}
                  role="menuitem"
                  className={`shell-nav-flyout-item${location.pathname === sub.url ? ' shell-nav-flyout-item--active' : ''}`}
                  onClick={() => {
                    setFlyout(null);
                    onNavigate?.();
                  }}
                >
                  {sub.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.title}>
        <button
          type="button"
          className={linkClass(!!subActive)}
          onClick={() => toggle(item.title)}
          aria-expanded={isOpen}
        >
          <item.icon />
          <span className="shell-nav-text">{item.title}</span>
          <ChevronRight size={15} className={`shell-nav-chevron${isOpen ? ' shell-nav-chevron--open' : ''}`} />
        </button>
        {isOpen && (
          <div className="shell-nav-children">
            {item.subItems?.map((sub) => (
              <Link
                key={sub.title}
                to={sub.url}
                className={`shell-nav-child${location.pathname === sub.url ? ' shell-nav-child--active' : ''}`}
                onClick={onNavigate}
              >
                {sub.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="shell-nav" aria-label="Main navigation">
        {flatItems.length > 0 && (
          <>
            <div className="shell-section-label">Menu</div>
            {flatItems.map(renderFlat)}
          </>
        )}
        {moduleItems.length > 0 && (
          <>
            <div className="shell-section-label">Modules</div>
            {moduleItems.map(renderModule)}
          </>
        )}
      </nav>
    </TooltipProvider>
  );
}
