

## Plan: Fix End of Tenancy Booking Price Discrepancy

### Problem Analysis
When End of Tenancy bookings are submitted, the price shown to the customer differs from the price saved in the database. Investigation reveals multiple code issues causing this:

1. **Incorrect Service Type Mapping**: The `serviceType` parameter is mapped to "Commercial" instead of "End of Tenancy Cleaning" when submitting via `create-public-booking`
2. **Missing End of Tenancy Handler in useAirbnbBookingSubmit.ts**: The `cleaning_type` calculation doesn't have a case for End of Tenancy, causing it to default to "checkin-checkout"
3. **Misleading Hourly Rate**: End of Tenancy uses fixed pricing from database configs, but the form still passes `hourlyRate: 28`, which could cause confusion if anything recalculates costs
4. **Zero Total Hours**: `total_hours` comes through as 0, which could trigger incorrect recalculations

---

### Technical Changes Required

#### 1. Fix PaymentStep.tsx - Service Type Mapping
Multiple locations in PaymentStep.tsx call `create-public-booking` with incorrect `serviceType` mapping. Need to update all instances:

**Current (broken):**
```javascript
serviceType: subServiceType === 'domestic' ? 'Domestic' : (subServiceType === 'airbnb' ? 'Air BnB' : 'Commercial'),
```

**Fixed:**
```javascript
serviceType: (() => {
  switch(subServiceType) {
    case 'domestic': return 'Domestic';
    case 'airbnb': return 'Air BnB';
    case 'carpet': return 'Carpet Cleaning';
    case 'end-of-tenancy': return 'End of Tenancy Cleaning';
    case 'commercial': return 'Commercial';
    default: return subServiceType;
  }
})(),
```

**Files to update:**
- Line ~1270 (new customer flow with PaymentElement)
- Line ~1408 (fallback Stripe Checkout flow)
- Line ~800+ (bank transfer flow)

#### 2. Fix PaymentStep.tsx - Cleaning Type Mapping
The `cleaningType` parameter is being set to 'Deep Cleaning' or 'Standard Cleaning' for all services, but End of Tenancy should use a fixed value:

**Current:**
```javascript
cleaningType: (data.wantsFirstDeepClean || data.serviceFrequency === 'onetime') ? 'Deep Cleaning' : 'Standard Cleaning',
```

**Fixed:**
```javascript
cleaningType: subServiceType === 'end-of-tenancy' 
  ? 'End of Tenancy' 
  : subServiceType === 'carpet'
  ? 'Carpet Cleaning'
  : (data.wantsFirstDeepClean || data.serviceFrequency === 'onetime') ? 'Deep Cleaning' : 'Standard Cleaning',
```

#### 3. Fix useAirbnbBookingSubmit.ts - Add End of Tenancy Handler
The `cleaning_type` calculation (lines 464-477) needs to handle End of Tenancy:

**Current logic falls through to:**
```javascript
return bookingData.serviceType || 'checkin-checkout';
```

**Add explicit case:**
```javascript
if (subType === 'end-of-tenancy') {
  return 'End of Tenancy';
}
if (subType === 'carpet') {
  return 'Carpet Cleaning';
}
```

#### 4. Fix Total Hours Passing
Ensure `totalHours` is populated from `estimatedHours` when not explicitly set:

In the booking payload construction, ensure:
```javascript
totalHours: data.totalHours || data.estimatedHours || 0,
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `sn-cleaning-booking-forms-main/src/components/booking/steps/PaymentStep.tsx` | Update serviceType and cleaningType mapping in 3+ locations where `create-public-booking` is called |
| `src/hooks/useAirbnbBookingSubmit.ts` | Add End of Tenancy and Carpet Cleaning cases to the `cleaning_type` determination logic |

---

### Testing Checklist
After implementation:
1. Create a new End of Tenancy booking as a guest customer
2. Verify the summary shows the correct price (e.g., £205.20)
3. Complete the booking and check the database record
4. Confirm `service_type` = "End of Tenancy Cleaning"
5. Confirm `cleaning_type` = "End of Tenancy"
6. Confirm `total_cost` matches the displayed price exactly
7. Test quote link flow to ensure quoted prices are preserved

