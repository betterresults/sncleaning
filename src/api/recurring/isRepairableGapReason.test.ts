import { describe, expect, it } from 'vitest';
import { isRepairableGapReason } from '@/api/recurring/types';

describe('isRepairableGapReason', () => {
  it('allows repair for missing upcoming bookings and horizon lag', () => {
    expect(isRepairableGapReason('no_upcoming_booking')).toBe(true);
    expect(isRepairableGapReason('horizon_lag')).toBe(true);
  });

  it('requires Edit for schedule/group data problems', () => {
    expect(isRepairableGapReason('missing_schedule_fields')).toBe(false);
    expect(isRepairableGapReason('missing_group_id')).toBe(false);
  });
});
