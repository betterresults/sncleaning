import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import type { ShellNavigationItem, ShellNavigationSubItem } from './types';

const HOVER_OPEN_MS = 200;
const HOVER_CLOSE_MS = 150;

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

function moduleHasActiveChild(item: ShellNavigationItem, pathname: string): boolean {
  return Boolean(item.subItems?.some((sub) => pathname === sub.url));
}

function useFinePointerHover() {
  const canHoverRef = useRef(false);

  useEffect(() => {
    canHoverRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  return canHoverRef;
}

interface ShellNavFlyoutProps {
  open: boolean;
  anchorEl: HTMLButtonElement | null;
  moduleTitle: string;
  subItems: ShellNavigationSubItem[];
  pathname: string;
  flyoutRef: React.RefObject<HTMLDivElement>;
  onNavigate?: () => void;
  onClose: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

function ShellNavFlyout({
  open,
  anchorEl,
  moduleTitle,
  subItems,
  pathname,
  flyoutRef,
  onNavigate,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: ShellNavFlyoutProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorEl) return;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const flyoutWidth = 220;
      const gap = 10;
      let left = rect.right + gap;
      let top = rect.top;

      if (left + flyoutWidth > window.innerWidth - 8) {
        left = Math.max(8, rect.left - flyoutWidth - gap);
      }

      const maxTop = window.innerHeight - 8;
      top = Math.min(top, maxTop - 40);

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorEl, subItems.length]);

  if (!open || !anchorEl) return null;

  return createPortal(
    <div
      ref={flyoutRef}
      className="shell-nav-flyout shell-nav-flyout--portal"
      role="menu"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <div className="shell-nav-flyout-title">{moduleTitle}</div>
      {subItems.map((sub) => {
        const SubIcon = sub.icon;
        return (
          <Link
            key={sub.title}
            to={sub.url}
            role="menuitem"
            className={`shell-nav-flyout-item${pathname === sub.url ? ' shell-nav-flyout-item--active' : ''}`}
            onClick={() => {
              onClose();
              onNavigate?.();
            }}
          >
            <span className="shell-nav-flyout-item-icon" aria-hidden>
              <SubIcon />
            </span>
            <span className="shell-nav-flyout-item-label">{sub.title}</span>
          </Link>
        );
      })}
    </div>,
    document.body
  );
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
  setAnchorRef: (el: HTMLButtonElement | null) => void;
  onToggle: (title: string) => void;
  onFlyoutToggle: (title: string) => void;
  onTriggerPointerEnter: (title: string) => void;
  onTriggerPointerLeave: () => void;
  onNavigate?: () => void;
}

const ModuleNavItem = memo(function ModuleNavItem({
  item,
  collapsed,
  pathname,
  isOpen,
  flyoutOpen,
  setAnchorRef,
  onToggle,
  onFlyoutToggle,
  onTriggerPointerEnter,
  onTriggerPointerLeave,
  onNavigate,
}: ModuleNavItemProps) {
  const subActive = moduleHasActiveChild(item, pathname);

  if (collapsed) {
    return (
      <div className="shell-nav-flyout-anchor">
        <button
          ref={setAnchorRef}
          type="button"
          className={`${navLinkClass(!!subActive, collapsed)} shell-nav-link--flyout-trigger`}
          data-tooltip={flyoutOpen ? undefined : item.title}
          onClick={() => onFlyoutToggle(item.title)}
          onMouseEnter={() => onTriggerPointerEnter(item.title)}
          onMouseLeave={onTriggerPointerLeave}
          aria-expanded={flyoutOpen}
          aria-haspopup="true"
        >
          <item.icon />
          <span className="shell-nav-text">{item.title}</span>
        </button>
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
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLButtonElement | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const anchorRefs = useRef(new Map<string, HTMLButtonElement>());
  const openTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const canHoverRef = useFinePointerHover();
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

  const activeModule = useMemo(
    () => moduleItems.find((item) => moduleHasActiveChild(item, pathname)) ?? null,
    [moduleItems, pathname]
  );

  const flyoutModule = useMemo(
    () => moduleItems.find((item) => item.title === flyout) ?? null,
    [moduleItems, flyout]
  );

  const clearHoverTimers = useCallback(() => {
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
  }, []);

  const setAnchorRef = useCallback(
    (title: string) => (el: HTMLButtonElement | null) => {
      if (el) anchorRefs.current.set(title, el);
      else anchorRefs.current.delete(title);
      setFlyoutAnchor((current) => {
        if (flyout === title) return el;
        return current;
      });
    },
    [flyout]
  );

  useEffect(() => {
    if (!flyout) {
      setFlyoutAnchor(null);
      return;
    }
    setFlyoutAnchor(anchorRefs.current.get(flyout) ?? null);
  }, [flyout, moduleItems]);

  // Expand accordion sections that contain the active route (expanded sidebar).
  useEffect(() => {
    if (collapsed) return;
    const titles = moduleItems
      .filter((item) => moduleHasActiveChild(item, pathname))
      .map((item) => item.title);
    if (titles.length === 0) return;
    setExpanded((prev) => {
      const next = new Set([...prev, ...titles]);
      return next.size === prev.length ? prev : [...next];
    });
  }, [collapsed, pathname, moduleItems]);

  // Auto-open flyout for the module that owns the current route (collapsed sidebar).
  useEffect(() => {
    if (!collapsed || !activeModule) return;
    setFlyout(activeModule.title);
  }, [collapsed, activeModule, pathname]);

  useEffect(() => {
    if (!collapsed) {
      clearHoverTimers();
      setFlyout(null);
    }
  }, [collapsed, clearHoverTimers]);

  useEffect(() => {
    if (!flyout) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (flyoutRef.current?.contains(target)) return;

      const anchor = anchorRefs.current.get(flyout);
      if (anchor?.contains(target)) return;

      clearHoverTimers();
      setFlyout(null);
    };

    document.addEventListener('mousedown', closeOnOutside, { capture: true });
    return () => document.removeEventListener('mousedown', closeOnOutside, { capture: true });
  }, [flyout, clearHoverTimers]);

  useEffect(() => () => clearHoverTimers(), [clearHoverTimers]);

  const toggle = useCallback((title: string) => {
    setExpanded((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  const handleFlyoutToggle = useCallback(
    (title: string) => {
      clearHoverTimers();
      setFlyout((prev) => (prev === title ? null : title));
    },
    [clearHoverTimers]
  );

  const handleFlyoutClose = useCallback(() => {
    clearHoverTimers();
    setFlyout(null);
  }, [clearHoverTimers]);

  const handleTriggerPointerEnter = useCallback(
    (title: string) => {
      if (!collapsed || !canHoverRef.current) return;
      clearTimeout(closeTimerRef.current);
      clearTimeout(openTimerRef.current);
      openTimerRef.current = setTimeout(() => setFlyout(title), HOVER_OPEN_MS);
    },
    [collapsed, canHoverRef]
  );

  const handleTriggerPointerLeave = useCallback(() => {
    if (!collapsed || !canHoverRef.current) return;
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setFlyout(null), HOVER_CLOSE_MS);
  }, [collapsed, canHoverRef]);

  const handleFlyoutPointerEnter = useCallback(() => {
    if (!canHoverRef.current) return;
    clearTimeout(closeTimerRef.current);
  }, [canHoverRef]);

  const handleFlyoutPointerLeave = useCallback(() => {
    if (!canHoverRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setFlyout(null), HOVER_CLOSE_MS);
  }, [canHoverRef]);

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
              setAnchorRef={setAnchorRef(item.title)}
              onToggle={toggle}
              onFlyoutToggle={handleFlyoutToggle}
              onTriggerPointerEnter={handleTriggerPointerEnter}
              onTriggerPointerLeave={handleTriggerPointerLeave}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}

      {collapsed && flyoutModule?.subItems && (
        <ShellNavFlyout
          open={Boolean(flyout)}
          anchorEl={flyoutAnchor}
          moduleTitle={flyoutModule.title}
          subItems={flyoutModule.subItems}
          pathname={pathname}
          flyoutRef={flyoutRef}
          onNavigate={onNavigate}
          onClose={handleFlyoutClose}
          onPointerEnter={handleFlyoutPointerEnter}
          onPointerLeave={handleFlyoutPointerLeave}
        />
      )}
    </nav>
  );
}

export const ShellNav = memo(ShellNavComponent);
