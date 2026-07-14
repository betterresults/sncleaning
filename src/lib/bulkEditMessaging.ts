export function formatBulkUpdateConfirmDescription(options: {
  selectedCount: number;
  fieldLabel: string;
  displayValue: string;
}): string {
  const { selectedCount, fieldLabel, displayValue } = options;
  const noun = selectedCount === 1 ? 'booking' : 'bookings';
  return `Update ${selectedCount} ${noun} — set ${fieldLabel} to ${displayValue}? This cannot be undone from this screen.`;
}

export function formatBulkUpdateSuccessToast(options: {
  updatedCount: number;
  selectedCount: number;
}): { title: string; description: string; variant: 'default' | 'destructive' } {
  const { updatedCount, selectedCount } = options;
  if (updatedCount === 0) {
    return {
      title: 'Update Failed',
      description: 'No bookings were updated. Please check your selection.',
      variant: 'destructive',
    };
  }
  const partial = updatedCount < selectedCount;
  return {
    title: partial ? 'Partially updated' : 'Update Successful',
    description: partial
      ? `Updated ${updatedCount} of ${selectedCount} selected booking${selectedCount !== 1 ? 's' : ''}. Some rows may not have changed due to permissions or filters.`
      : `Successfully updated ${updatedCount} booking${updatedCount !== 1 ? 's' : ''}`,
    variant: partial ? 'destructive' : 'default',
  };
}
