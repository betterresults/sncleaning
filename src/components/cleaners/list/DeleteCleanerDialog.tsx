import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  cleanerDeleteIsBlocked,
  fetchCleanerDeleteImpact,
  type CleanerData,
  type CleanerDeleteImpact,
} from '@/api/cleaners';

export interface DeleteCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cleaner: CleanerData | null;
  onConfirm: (cleanerId: number) => void;
  isDeleting?: boolean;
}

export function DeleteCleanerDialog({
  open,
  onOpenChange,
  cleaner,
  onConfirm,
  isDeleting,
}: DeleteCleanerDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [impact, setImpact] = useState<CleanerDeleteImpact | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !cleaner) {
      setConfirmText('');
      setImpact(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoadingImpact(true);
    setLoadError(null);

    fetchCleanerDeleteImpact(cleaner.id)
      .then((data) => {
        if (!cancelled) setImpact(data);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setLoadError(error.message || 'Failed to load related records');
          setImpact(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingImpact(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, cleaner]);

  if (!cleaner) return null;

  const name = `${cleaner.first_name} ${cleaner.last_name}`.trim() || cleaner.email;
  const blocked = impact ? cleanerDeleteIsBlocked(impact) : true;
  const canConfirm =
    !!impact && !blocked && !loadingImpact && !loadError && confirmText === 'DELETE';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete cleaner
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                You are about to permanently delete <strong className="text-foreground">{name}</strong>{' '}
                (ID {cleaner.id}).
              </p>

              {loadingImpact && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking related bookings and account…
                </div>
              )}

              {loadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                  {loadError}
                </div>
              )}

              {impact && !loadingImpact && (
                <div className="space-y-3">
                  {blocked ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
                      <p className="font-medium text-foreground">
                        Delete is blocked until these are cleared
                      </p>
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        {impact.upcomingBookings > 0 && (
                          <li>{impact.upcomingBookings} upcoming booking(s) as primary cleaner</li>
                        )}
                        {impact.pastBookings > 0 && (
                          <li>{impact.pastBookings} past booking(s) still linked</li>
                        )}
                        {impact.recurringServices > 0 && (
                          <li>{impact.recurringServices} recurring service(s)</li>
                        )}
                        {impact.payments > 0 && (
                          <li>{impact.payments} cleaner payment row(s)</li>
                        )}
                        {impact.photos > 0 && (
                          <li>{impact.photos} cleaning photo(s)</li>
                        )}
                      </ul>
                      <p className="mt-2 text-xs">
                        Reassign or unlink them first, then try again. The database will reject the
                        delete while these references exist.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="font-medium text-foreground">This will also remove</p>
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        <li>Service types, coverage areas, and working hours</li>
                        <li>Google Calendar connection and synced busy blocks</li>
                        <li>Cleaner chats linked to this profile</li>
                      </ul>
                    </div>
                  )}

                  {(impact.hasLoginAccount || cleaner.has_account) && (
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="font-medium text-foreground">Login account stays</p>
                      <p className="mt-1">
                        Their auth login
                        {impact.loginEmail ? (
                          <>
                            {' '}
                            (<span className="font-mono text-foreground">{impact.loginEmail}</span>)
                          </>
                        ) : null}{' '}
                        is not deleted. The profile link to this cleaner will be cleared, leaving an
                        orphaned cleaner login you can remove under Users → Cleaner logins.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!blocked && impact && !loadingImpact && !loadError && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-cleaner" className="text-sm font-medium text-foreground">
                    Type <span className="rounded bg-muted px-1 font-mono">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-cleaner"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canConfirm || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              if (!canConfirm || !cleaner) return;
              onConfirm(cleaner.id);
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : blocked ? (
              'Cannot delete yet'
            ) : (
              'Delete permanently'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
