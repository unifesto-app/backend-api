-- Migration: Add phone and organization fields to profiles table
-- Run this in Supabase SQL editor

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone VARCHAR(15);
  END IF;
END $$;

-- Add organization column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'organization'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization VARCHAR(255);
  END IF;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization);

-- Update existing profiles to have default values if needed
UPDATE profiles SET phone = NULL WHERE phone = '';
UPDATE profiles SET organization = NULL WHERE organization = '';

-- Add comments
COMMENT ON COLUMN profiles.phone IS 'User phone number (10 digits)';
COMMENT ON COLUMN profiles.organization IS 'User organization/institution name';

