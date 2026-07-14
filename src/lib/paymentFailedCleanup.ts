export function parsePaymentFailedBookingId(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPaymentFailedCleanupCopy(options: {
  hasBookingId: boolean;
  cleanupDone: boolean;
  cleanupFailed: boolean;
}): string | null {
  const { hasBookingId, cleanupDone, cleanupFailed } = options;
  if (hasBookingId && !cleanupDone) return null;
  if (cleanupFailed) {
    return 'Payment did not complete. If a booking appears in your account unpaid, please contact support so we can remove it.';
  }
  return 'Payment did not complete. Any incomplete booking has been cancelled so you will not be charged. Please try again with a different payment method.';
}
