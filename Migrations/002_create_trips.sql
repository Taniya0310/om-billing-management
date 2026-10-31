CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_date TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 0,
  freight REAL NOT NULL DEFAULT 0,
  booking REAL NOT NULL DEFAULT 0,
  advance REAL NOT NULL DEFAULT 0,
  challan REAL NOT NULL DEFAULT 0,
  receiver TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  driver_phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'In transit',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(user_id, trip_date);
