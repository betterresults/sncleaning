import React from 'react';
import { cn } from '@/lib/utils';
import type { BookingBlock } from './types';

interface AvailabilityBookingOverlayProps {
  blocks: BookingBlock[];
  highlightedBookingId?: number | null;
  onSelectBooking: (bookingId: number) => void;
}

const AvailabilityBookingOverlay: React.FC<AvailabilityBookingOverlayProps> = ({
  blocks,
  highlightedBookingId,
  onSelectBooking,
}) => (
  <>
    {blocks.map((block) => {
      const content = (
        <>
          <p className="truncate font-semibold">{block.timeLabel}</p>
          <p className="truncate text-muted-foreground">{block.label}</p>
        </>
      );

      const className = cn(
        'absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] bg-card px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight shadow-sm transition-all',
        block.source === 'google'
          ? 'border-l-violet-500 bg-violet-50/80 text-violet-950 ring-1 ring-violet-200'
          : block.outsideHours
            ? 'border-l-amber-500 text-amber-900'
            : 'border-l-primary text-foreground',
        block.source === 'booking' &&
          highlightedBookingId === block.bookingId &&
          'z-10 ring-2 ring-amber-400 ring-offset-1 animate-pulse'
      );

      const style = { top: block.topPx, height: Math.max(block.heightPx, 18) };

      if (block.source === 'google') {
        return (
          <div
            key={block.id}
            title={`${block.timeLabel} · ${block.label} from Google Calendar`}
            className={cn(className, 'pointer-events-none')}
            style={style}
          >
            {content}
          </div>
        );
      }

      return (
        <button
          key={block.id}
          type="button"
          onClick={() => block.bookingId && onSelectBooking(block.bookingId)}
          title={`${block.timeLabel} · ${block.label}${block.outsideHours ? ' (outside set hours)' : ''} - click for details`}
          className={cn(
            className,
            'pointer-events-auto hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
          )}
          style={style}
        >
          {content}
        </button>
      );
    })}
  </>
);

export default AvailabilityBookingOverlay;
