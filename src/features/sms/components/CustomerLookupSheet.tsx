import { Phone, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { CustomerLookupResult } from '../types';
import { CustomerLookupContent } from './CustomerLookupContent';

interface CustomerLookupSheetProps {
  phoneNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lookupLoading: boolean;
  lookupResult: CustomerLookupResult | null;
  onOpen: () => void;
}

export function CustomerLookupSheet({
  phoneNumber,
  open,
  onOpenChange,
  lookupLoading,
  lookupResult,
  onOpen,
}: CustomerLookupSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) onOpen();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserSearch className="h-4 w-4" />
          <span className="hidden sm:inline">Lookup</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserSearch className="h-5 w-5" />
            Customer Lookup
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span className="font-mono">{phoneNumber}</span>
          </div>

          {lookupLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : lookupResult ? (
            <CustomerLookupContent lookupResult={lookupResult} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
