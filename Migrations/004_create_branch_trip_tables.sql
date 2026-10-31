CREATE SEQUENCE IF NOT EXISTS jsr_trip_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS mh_trip_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS trips_jamshedpur (
  id TEXT PRIMARY KEY, trip_number INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_date TEXT NOT NULL, client_name TEXT NOT NULL DEFAULT '', vehicle TEXT NOT NULL,
  origin TEXT NOT NULL, destination TEXT NOT NULL, weight REAL NOT NULL DEFAULT 0,
  freight REAL NOT NULL DEFAULT 0, booking REAL NOT NULL DEFAULT 0, advance REAL NOT NULL DEFAULT 0,
  challan REAL NOT NULL DEFAULT 0, receiver TEXT NOT NULL DEFAULT '', owner TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', driver_phone TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'In transit',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips_maharashtra (
  id TEXT PRIMARY KEY, trip_number INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_date TEXT NOT NULL, client_name TEXT NOT NULL DEFAULT '', vehicle TEXT NOT NULL,
  origin TEXT NOT NULL, destination TEXT NOT NULL, weight REAL NOT NULL DEFAULT 0,
  freight REAL NOT NULL DEFAULT 0, booking REAL NOT NULL DEFAULT 0, advance REAL NOT NULL DEFAULT 0,
  challan REAL NOT NULL DEFAULT 0, receiver TEXT NOT NULL DEFAULT '', owner TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', driver_phone TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'In transit',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trips_jamshedpur_user_id ON trips_jamshedpur(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_maharashtra_user_id ON trips_maharashtra(user_id);

INSERT INTO trips_jamshedpur (
  id, trip_number, user_id, trip_date, client_name, vehicle, origin, destination,
  weight, freight, booking, advance, challan, receiver, owner, phone, driver_phone,
  status, created_at, updated_at
)
SELECT 'Jsr-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at, id)::text, 3, '0'),
  ROW_NUMBER() OVER (ORDER BY created_at, id),
  user_id, trip_date, client_name, vehicle, origin, destination, weight, freight,
  booking, advance, challan, receiver, owner, phone, driver_phone, status, created_at, updated_at
FROM trips ON CONFLICT (id) DO NOTHING;

-- Renumber branch records to the 001-based format if this migration was already applied.
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, trip_number, id)::integer AS new_number
  FROM trips_jamshedpur
), renamed AS (
  SELECT id, new_number, 'Jsr-' || LPAD(new_number::text, 3, '0') AS new_id
  FROM numbered
)
UPDATE trips_jamshedpur AS trips
SET id = renamed.new_id, trip_number = renamed.new_number
FROM renamed
WHERE trips.id = renamed.id;

SELECT setval('jsr_trip_number_seq', COALESCE((SELECT MAX(trip_number) FROM trips_jamshedpur), 1), (SELECT COUNT(*) > 0 FROM trips_jamshedpur));
SELECT setval('mh_trip_number_seq', COALESCE((SELECT MAX(trip_number) FROM trips_maharashtra), 1), (SELECT COUNT(*) > 0 FROM trips_maharashtra));
