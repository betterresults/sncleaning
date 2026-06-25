import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import type { ShellNavigationItem } from './types';

interface ShellNavProps {
  items: ShellNavigationItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

function navLinkClass(active: boolean, collapsed: boolean, disabled?: boolean) {
  let c = 'shell-nav-link';
  if (active) c += ' shell-nav-link--active';
  if (disabled) c += ' shell-nav-link--disabled';
  if (collapsed) c += ' shell-nav-link--collapsed';
  return c;
}

interface FlatNavItemProps {
  item: ShellNavigationItem;
  collapsed: boolean;
  active: boolean;
  availableCount?: number;
  onNavigate?: () => void;
}

const FlatNavItem = memo(function FlatNavItem({
  item,
  collapsed,
  active,
  availableCount,
  onNavigate,
}: FlatNavItemProps) {
  const showBadge =
    item.showCount &&
    item.countKey === 'available-bookings-count' &&
    availableCount &&
    availableCount > 0;

  if (item.disabled) {
    return (
      <div
        className={navLinkClass(false, collapsed, true)}
        data-tooltip={collapsed ? item.title : undefined}
      >
        <item.icon />
        <span className="shell-nav-text">{item.title}</span>
      </div>
    );
  }

  return (
    <Link
      to={item.url!}
      className={navLinkClass(active, collapsed)}
      data-tooltip={collapsed ? item.title : undefined}
      onClick={onNavigate}
    >
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
});

interface ModuleNavItemProps {
  item: ShellNavigationItem;
  collapsed: boolean;
  pathname: string;
  isOpen: boolean;
  flyoutOpen: boolean;
  flyoutRef: React.RefObject<HTMLDivElement>;
  onToggle: (title: string) => void;
  onFlyoutToggle: (title: string) => void;
  onFlyoutClose: () => void;
  onNavigate?: () => void;
}

const ModuleNavItem = memo(function ModuleNavItem({
  item,
  collapsed,
  pathname,
  isOpen,
  flyoutOpen,
  flyoutRef,
  onToggle,
  onFlyoutToggle,
  onFlyoutClose,
  onNavigate,
}: ModuleNavItemProps) {
  const subActive = item.subItems?.some((s) => pathname === s.url);

  if (collapsed) {
    return (
      <div className="shell-nav-flyout-anchor">
        <button
          type="button"
          className={`${navLinkClass(!!subActive, collapsed)} shell-nav-link--flyout-trigger`}
          data-tooltip={item.title}
          onClick={() => onFlyoutToggle(item.title)}
          aria-expanded={flyoutOpen}
          aria-haspopup="true"
        >
          <item.icon />
          <span className="shell-nav-text">{item.title}</span>
        </button>
        {flyoutOpen && (
          <div ref={flyoutRef} className="shell-nav-flyout" role="menu">
            <div className="shell-nav-flyout-title">{item.title}</div>
            {item.subItems?.map((sub) => (
              <Link
                key={sub.title}
                to={sub.url}
                role="menuitem"
                className={`shell-nav-flyout-item${pathname === sub.url ? ' shell-nav-flyout-item--active' : ''}`}
                onClick={() => {
                  onFlyoutClose();
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
    <div>
      <button
        type="button"
        className={navLinkClass(!!subActive, collapsed)}
        onClick={() => onToggle(item.title)}
        aria-expanded={isOpen}
      >
        <item.icon />
        <span className="shell-nav-text">{item.title}</span>
        <ChevronRight
          size={15}
          className={`shell-nav-chevron${isOpen ? ' shell-nav-chevron--open' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="shell-nav-children">
          {item.subItems?.map((sub) => (
            <Link
              key={sub.title}
              to={sub.url}
              className={`shell-nav-child${pathname === sub.url ? ' shell-nav-child--active' : ''}`}
              onClick={onNavigate}
            >
              {sub.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});

function ShellNavComponent({ items, collapsed = false, onNavigate }: ShellNavProps) {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [flyout, setFlyout] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const { data: availableCount } = useAvailableBookingsCount();

  const { flatItems, moduleItems } = useMemo(() => {
    const flat: ShellNavigationItem[] = [];
    const modules: ShellNavigationItem[] = [];
    for (const item of items) {
      if (item.subItems?.length) modules.push(item);
      else flat.push(item);
    }
    return { flatItems: flat, moduleItems: modules };
  }, [items]);

  useEffect(() => {
    if (!flyout) return;
    const close = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyout(null);
      }
    };
    document.addEventListener('mousedown', close, { capture: true });
    return () => document.removeEventListener('mousedown', close, { capture: true });
  }, [flyout]);

  useEffect(() => {
    if (!collapsed) setFlyout(null);
  }, [collapsed]);

  const toggle = useCallback((title: string) => {
    setExpanded((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  const handleFlyoutToggle = useCallback((title: string) => {
    setFlyout((prev) => (prev === title ? null : title));
  }, []);

  const handleFlyoutClose = useCallback(() => setFlyout(null), []);

  return (
    <nav className="shell-nav" aria-label="Main navigation">
      {flatItems.length > 0 && (
        <>
          <div className="shell-section-label">Menu</div>
          {flatItems.map((item) => (
            <FlatNavItem
              key={item.title}
              item={item}
              collapsed={collapsed}
              active={Boolean(item.url && pathname === item.url && !item.disabled)}
              availableCount={availableCount}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
      {moduleItems.length > 0 && (
        <>
          <div className="shell-section-label">Modules</div>
          {moduleItems.map((item) => (
            <ModuleNavItem
              key={item.title}
              item={item}
              collapsed={collapsed}
              pathname={pathname}
              isOpen={expanded.includes(item.title)}
              flyoutOpen={flyout === item.title}
              flyoutRef={flyoutRef}
              onToggle={toggle}
              onFlyoutToggle={handleFlyoutToggle}
              onFlyoutClose={handleFlyoutClose}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
    </nav>
  );
}

export const ShellNav = memo(ShellNavComponent);
