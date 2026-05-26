UPDATE public.bookings
SET payment_status = 'failed_permanent',
    payment_attempt_count = 3,
    last_payment_attempt_at = now()
WHERE id = 111136
  AND payment_status = 'failed';