import React from 'react';

const AvailabilityLegend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-background px-4 py-2.5 text-xs font-medium text-muted-foreground">
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm bg-primary/20 ring-1 ring-primary/30" aria-hidden />
      Available
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm border-l-[3px] border-l-primary bg-card ring-1 ring-border" aria-hidden />
      Booked
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm border-l-[3px] border-l-amber-500 bg-card ring-1 ring-border" aria-hidden />
      Outside hours
    </span>
  </div>
);

export default AvailabilityLegend;
