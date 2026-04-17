-- Setup profiles table with all required fields
-- Run this in Supabase SQL editor

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone VARCHAR(15),
  organization VARCHAR(255),
  role TEXT NOT NULL DEFAULT 'attendee',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone VARCHAR(15);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization') THEN
    ALTER TABLE public.profiles ADD COLUMN organization VARCHAR(255);
  END IF;
END $$;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_profiles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_profiles();

-- Add comments
COMMENT ON TABLE public.profiles IS 'User profiles with extended information';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number (10 digits)';
COMMENT ON COLUMN public.profiles.organization IS 'User organization/institution name';
COMMENT ON COLUMN public.profiles.role IS 'User role: attendee, organizer, admin, super_admin';
COMMENT ON COLUMN public.profiles.status IS 'Account status: active, inactive, suspended';
