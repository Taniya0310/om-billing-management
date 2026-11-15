ALTER TABLE trips_jamshedpur
  ADD COLUMN IF NOT EXISTS reporting_date TEXT,
  ADD COLUMN IF NOT EXISTS unloading_date TEXT;

ALTER TABLE trips_maharashtra
  ADD COLUMN IF NOT EXISTS reporting_date TEXT,
  ADD COLUMN IF NOT EXISTS unloading_date TEXT;

UPDATE trips_jamshedpur
SET reporting_date = trip_date
WHERE reporting_date IS NULL OR reporting_date = '';

UPDATE trips_maharashtra
SET reporting_date = trip_date
WHERE reporting_date IS NULL OR reporting_date = '';
