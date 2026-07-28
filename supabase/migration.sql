-- Migration: Create tables for Signage Control Panel

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  lokasi VARCHAR(255) DEFAULT '',
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul VARCHAR(255) NOT NULL,
  tipe VARCHAR(50) NOT NULL DEFAULT 'url',
  payload TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, untuk auth nanti)
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

-- Buat policy public untuk sementara (bisa diperketat dengan JWT nanti)
CREATE POLICY "Public access for devices" ON devices FOR ALL USING (true);
CREATE POLICY "Public access for contents" ON contents FOR ALL USING (true);

-- Trigger untuk update last_seen
CREATE OR REPLACE FUNCTION update_last_seen() RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER devices_update_last_seen
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- Playlist: hubungan device-content dengan urutan
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  urutan INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, content_id)
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for playlists" ON playlists FOR ALL USING (true);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS not used on users table because we use custom JWT (not Supabase Auth)
-- Passwords are hashed with bcrypt for security
