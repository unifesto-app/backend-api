-- Create careers table
CREATE TABLE IF NOT EXISTS public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  salary_range TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_careers_status ON public.careers(status);
CREATE INDEX IF NOT EXISTS idx_careers_department ON public.careers(department);
CREATE INDEX IF NOT EXISTS idx_careers_type ON public.careers(type);
CREATE INDEX IF NOT EXISTS idx_careers_created_at ON public.careers(created_at DESC);

-- Enable RLS
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active careers
CREATE POLICY "Anyone can view active careers"
  ON public.careers
  FOR SELECT
  USING (status = 'active');

-- Policy: Admins can view all careers
CREATE POLICY "Admins can view all careers"
  ON public.careers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Admins can insert careers
CREATE POLICY "Admins can insert careers"
  ON public.careers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Admins can update careers
CREATE POLICY "Admins can update careers"
  ON public.careers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Admins can delete careers
CREATE POLICY "Admins can delete careers"
  ON public.careers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_careers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER careers_updated_at
  BEFORE UPDATE ON public.careers
  FOR EACH ROW
  EXECUTE FUNCTION update_careers_updated_at();
