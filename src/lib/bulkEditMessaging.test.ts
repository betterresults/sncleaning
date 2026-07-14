import { describe, expect, it } from 'vitest';
import {
  formatBulkUpdateConfirmDescription,
  formatBulkUpdateSuccessToast,
} from '@/lib/bulkEditMessaging';

describe('bulkEditMessaging', () => {
  it('builds confirm copy with pluralization', () => {
    expect(
      formatBulkUpdateConfirmDescription({
        selectedCount: 1,
        fieldLabel: 'Status',
        displayValue: 'completed',
      }),
    ).toBe(
      'Update 1 booking — set Status to completed? This cannot be undone from this screen.',
    );

    expect(
      formatBulkUpdateConfirmDescription({
        selectedCount: 3,
        fieldLabel: 'Payment status',
        displayValue: 'paid',
      }),
    ).toContain('3 bookings');
  });

  it('builds partial vs full success toasts', () => {
    expect(
      formatBulkUpdateSuccessToast({ updatedCount: 5, selectedCount: 5 }),
    ).toMatchObject({ title: 'Update Successful', variant: 'default' });

    expect(
      formatBulkUpdateSuccessToast({ updatedCount: 2, selectedCount: 5 }),
    ).toMatchObject({ title: 'Partially updated', variant: 'destructive' });

    expect(
      formatBulkUpdateSuccessToast({ updatedCount: 0, selectedCount: 5 }),
    ).toMatchObject({ title: 'Update Failed', variant: 'destructive' });
  });
});
