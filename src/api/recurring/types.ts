export type RecurringGenerationGapReason =
  | 'missing_schedule_fields'
  | 'missing_group_id'
  | 'no_upcoming_booking'
  | 'horizon_lag';

export interface RecurringGenerationGap {
  service_id: number;
  customer_name: string | null;
  frequently: string | null;
  days_of_the_week: string | null;
  was_created_until: string | null;
  start_time: string | null;
  reason: RecurringGenerationGapReason;
}

export interface RecurringGenerationLastRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error';
  triggered_by: 'cron' | 'admin';
  services_processed: number;
  bookings_created: number;
  bookings_skipped: number;
  services_with_errors: number;
  error_message: string | null;
}

export interface RecurringGenerationHealth {
  active_series: number;
  gap_count: number;
  gaps: RecurringGenerationGap[];
  last_run: RecurringGenerationLastRun | null;
}

export interface RecurringGenerationRunResult {
  run_id: number;
  triggered_by: 'cron' | 'admin';
  services_processed: number;
  bookings_created: number;
  bookings_skipped: number;
  services_with_errors: number;
  errors: Array<{ service_id?: number; error: string }>;
}
