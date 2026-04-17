-- Promote specific user to super admin
-- Run this in Supabase SQL editor AFTER the user has signed up

-- Replace 'your-admin@example.com' with your actual admin email
INSERT INTO public.profiles (id, email, role, status)
SELECT u.id, LOWER(u.email), 'super_admin', 'active'
FROM auth.users u
WHERE LOWER(u.email) = 'unifestoapp@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = 'super_admin',
  status = 'active',
  updated_at = NOW();

-- Note: If no rows were inserted, the user hasn't signed up yet.
-- First sign up with the email, then run this script.

-- To add more admins, duplicate the INSERT statement with different emails:
-- INSERT INTO public.profiles (id, email, role, status)
-- SELECT u.id, LOWER(u.email), 'admin', 'active'
-- FROM auth.users u
-- WHERE LOWER(u.email) = 'another-admin@example.com'
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'admin', status = 'active', updated_at = NOW();
