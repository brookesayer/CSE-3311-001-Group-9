CREATE TABLE IF NOT EXISTS places (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION
);

-- Optional de-dup (add once; remove if you expect same name/address multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_place'
  ) THEN
    ALTER TABLE places ADD CONSTRAINT uniq_place UNIQUE (name, address);
  END IF;
END$$;
