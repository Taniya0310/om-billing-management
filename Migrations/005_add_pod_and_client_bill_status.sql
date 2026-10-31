ALTER TABLE trips_jamshedpur
  ADD COLUMN IF NOT EXISTS pod_status TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS client_bill_status TEXT NOT NULL DEFAULT 'Not made';

ALTER TABLE trips_maharashtra
  ADD COLUMN IF NOT EXISTS pod_status TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS client_bill_status TEXT NOT NULL DEFAULT 'Not made';
