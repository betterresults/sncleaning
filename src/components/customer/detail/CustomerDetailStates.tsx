import { Loader2 } from 'lucide-react';

export function CustomerDetailLoading() {
  return (
    <div className="text-center py-8">
      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      <p className="mt-2 text-muted-foreground">Loading customer data...</p>
    </div>
  );
}

export function CustomerDetailNotFound() {
  return (
    <div className="text-center py-8 text-muted-foreground">Customer not found</div>
  );
}
