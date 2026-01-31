
# Fix Domestic Cleaning Price Discrepancy

## Problem Summary
When domestic cleaning bookings are submitted, the price saved to the database differs from what should be calculated based on database configuration. A recent booking for 5 hours one-time cleaning was saved as £110 instead of the correct £112.50.

## Root Cause Analysis

### Issue 1: Hourly Rate Not Synced
The form state `hourlyRate` is initialized to a hardcoded value of £22 but never updated with the correct rate from the database configuration (£25 for one-time cleaning).

**Flow Breakdown:**
1. `DomesticBookingForm.tsx` initializes `hourlyRate: 22` (hardcoded)
2. `useDomesticHardcodedCalculations.ts` correctly fetches £25/hour for one-time from database
3. `DomesticBookingSummary.tsx` syncs several values but **NOT** `hourlyRate`
4. `PaymentStep.tsx` sends `data.hourlyRate` (£22) to the edge function

### Issue 2: Database Saved Wrong Values
The edge function receives:
- `hourlyRate: 22` (wrong - should be 25)
- `totalCost: 110` (wrong - should be 112.50)

**Calculation Difference:**
- Expected: 5h × £25 = £125 × 0.90 (first-time discount) = £112.50
- Actual: 5h × £22 = £110 (no discount applied)

---

## Technical Solution

### Change 1: Sync `hourlyRate` in DomesticBookingSummary.tsx
Add `hourlyRate` to the list of values synced from calculations back to the parent form state.

**Location:** `sn-cleaning-booking-forms-main/src/components/booking/DomesticBookingSummary.tsx` (around line 262-295)

**Current sync logic:**
```javascript
const updates: Partial<DomesticBookingData> = {};
// Syncs: totalCost, estimatedHours, shortNoticeCharge, regularRecurringCost, wantsFirstDeepClean
// MISSING: hourlyRate
```

**Add:**
```javascript
// Sync hourlyRate so it's available for booking submission
if (calculations.hourlyRate !== data.hourlyRate) {
  updates.hourlyRate = calculations.hourlyRate;
}
```

### Change 2: Fallback in PaymentStep.tsx
As a safety net, update `PaymentStep.tsx` to use the calculated hourly rate when submitting bookings.

**Location:** `sn-cleaning-booking-forms-main/src/components/booking/steps/PaymentStep.tsx` (multiple locations where `hourlyRate: data.hourlyRate` is passed)

**Update all occurrences of:**
```javascript
hourlyRate: data.hourlyRate,
```

**To:**
```javascript
hourlyRate: domesticCalculations?.hourlyRate || data.hourlyRate || 25,
```

This applies to approximately 8 locations in the file where `create-public-booking` or `submitBooking` is called.

---

## Files to Modify

| File | Changes |
|------|---------|
| `sn-cleaning-booking-forms-main/src/components/booking/DomesticBookingSummary.tsx` | Add `hourlyRate` to the useEffect sync logic |
| `sn-cleaning-booking-forms-main/src/components/booking/steps/PaymentStep.tsx` | Use `domesticCalculations.hourlyRate` as fallback in all booking submission calls |
| `sn-cleaning-booking-forms-main/src/components/booking/DomesticBookingForm.tsx` | Update initial `hourlyRate` default to 25 to match one-time rate |

---

## Database Configuration Reference
Current values in `airbnb_field_configs`:
- One-time (onetime): £25/hour
- Weekly: £23/hour  
- Bi-weekly: £24/hour
- Monthly: £24/hour

---

## Testing Checklist
1. Create a new domestic one-time cleaning booking as a guest
2. Verify the summary shows the correct calculation (e.g., 5h × £25 = £125, with 10% first-time = £112.50)
3. Complete the booking and check the database record
4. Confirm `cleaning_cost_per_hour` = 25 (not 22)
5. Confirm `total_cost` matches the displayed price
6. Test weekly/biweekly/monthly bookings to ensure correct rates apply
7. Test returning customer bookings (no first-time discount)
