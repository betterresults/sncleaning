import React from 'react';
import { cn } from '@/lib/utils';
import type { BookingBlock } from './types';

interface AvailabilityBookingOverlayProps {
  blocks: BookingBlock[];
  onSelectBooking: (bookingId: number) => void;
}

const AvailabilityBookingOverlay: React.FC<AvailabilityBookingOverlayProps> = ({ blocks, onSelectBooking }) => (
  <>
    {blocks.map((block) => (
      <button
        key={block.id}
        type="button"
        onClick={() => onSelectBooking(block.id)}
        title={`${block.timeLabel} · ${block.label}${block.outsideHours ? ' (outside set hours)' : ''} — click for details`}
        className={cn(
          'pointer-events-auto absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] bg-card px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          block.outsideHours
            ? 'border-l-amber-500 text-amber-900'
            : 'border-l-primary text-foreground'
        )}
        style={{ top: block.topPx, height: Math.max(block.heightPx, 18) }}
      >
        <p className="truncate font-semibold">{block.timeLabel}</p>
        <p className="truncate text-muted-foreground">{block.label}</p>
      </button>
    ))}
  </>
);

export default AvailabilityBookingOverlay;
