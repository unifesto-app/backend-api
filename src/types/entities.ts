// Database entity types
export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  organization?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type Event = {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  category?: string;
  organization_id?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
};

export type Organization = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  action: string;
  module: string;
  user_id?: string;
  details?: any;
  created_at: string;
};

export type ApiKey = {
  id: string;
  name: string;
  key_hash: string;
  permissions: string;
  expires_at?: string;
  last_used_at?: string;
  created_by: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: string;
  severity: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
};
