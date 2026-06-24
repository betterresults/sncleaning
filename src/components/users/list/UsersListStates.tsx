import { Loader2 } from 'lucide-react';

export function UsersListLoading() {
  return (
    <div className="text-center py-8">
      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      <p className="mt-2 text-muted-foreground">Loading users...</p>
    </div>
  );
}
