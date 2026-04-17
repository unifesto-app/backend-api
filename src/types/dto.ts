// Data Transfer Objects for API requests/responses

// Auth DTOs
export type RegisterUserDto = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  password: string;
};

export type LoginUserDto = {
  email: string;
  password: string;
};

export type GoogleAuthDto = {
  id_token: string;
};

// User DTOs
export type CreateUserDto = {
  email: string;
  full_name?: string;
  role?: string;
};

export type UpdateUserDto = {
  full_name?: string;
  role?: string;
  status?: string;
};

export type UserFilterDto = {
  search?: string;
  role?: string;
  status?: string;
};

// Event DTOs
export type CreateEventDto = {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  category?: string;
  organization_id?: string;
};

export type UpdateEventDto = Partial<CreateEventDto> & {
  status?: string;
};

export type EventFilterDto = {
  search?: string;
  status?: string;
  category?: string;
  date?: string;
};

// Organization DTOs
export type CreateOrganizationDto = {
  name: string;
  slug?: string;
  description?: string;
};

export type UpdateOrganizationDto = Partial<CreateOrganizationDto>;

// Admin DTOs
export type CreateAnnouncementDto = {
  title: string;
  message: string;
  audience: string;
  severity?: string;
};

export type CreateApiKeyDto = {
  name: string;
  permissions?: string;
  expires_at?: string;
};

export type CreateCategoryDto = {
  name: string;
  slug: string;
  description?: string;
};

export type CreateRoleDto = {
  name: string;
  description?: string;
  permissions?: string[];
};

export type UpdateRoleDto = Partial<CreateRoleDto>;
