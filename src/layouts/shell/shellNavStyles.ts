import { cn } from '@/lib/utils';

export function shellNavLinkClass(
  active: boolean,
  collapsed: boolean,
  options?: { disabled?: boolean; flyoutTrigger?: boolean; flyoutOpen?: boolean },
) {
  return cn(
    'mb-0.5 flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent p-2.5 text-left text-sm font-medium text-shell-muted no-underline transition-[background,color] duration-200',
    'hover:text-shell-text hover:bg-white/20',
    active && 'font-semibold text-shell-text bg-white/[0.48] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.7)]',
    options?.disabled && 'cursor-not-allowed opacity-45 hover:bg-transparent hover:text-shell-muted',
    collapsed && 'justify-center gap-0 px-2 py-[11px]',
    options?.flyoutTrigger && options?.flyoutOpen && 'bg-white/[0.35] text-shell-text',
    '[&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0 [&_svg]:opacity-70',
    active && '[&_svg]:opacity-100',
  );
}

export function shellNavTextClass(collapsed: boolean) {
  return cn(
    'min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-shell-sidebar ease-shell-sidebar',
    collapsed && 'hidden',
  );
}

export function shellSectionLabelClass(collapsed: boolean) {
  return cn(
    'mt-2 overflow-hidden whitespace-nowrap px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-wide text-shell-faint transition-[opacity,height,padding,margin] duration-200 first:mt-0',
    collapsed && 'm-0 h-0 p-0 opacity-0',
  );
}
