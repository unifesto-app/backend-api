-- Create app_trackers table for tracking page views
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.app_trackers (
  id BIGSERIAL PRIMARY KEY,
  device_id CHAR(10) NOT NULL CHECK (device_id ~ '^\d{10}$'),
  view TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, view)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_trackers_device_last_seen
  ON public.app_trackers (device_id, last_seen_at DESC);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_app_trackers()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_app_trackers ON public.app_trackers;
CREATE TRIGGER trg_set_updated_at_app_trackers
BEFORE UPDATE ON public.app_trackers
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_app_trackers();

COMMENT ON TABLE public.app_trackers IS 'Tracks page views by device ID';
COMMENT ON COLUMN public.app_trackers.device_id IS '10-digit device identifier';
COMMENT ON COLUMN public.app_trackers.view IS 'Page/view identifier';
COMMENT ON COLUMN public.app_trackers.view_count IS 'Number of times viewed';
