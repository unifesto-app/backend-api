import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

type AuthContext = {
  user: User;
  supabase: any;
  accessToken: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const parseBearerToken = (request: NextRequest) => {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
};

const unauthorized = (message = "Unauthorized") =>
  Response.json({ success: false, error: message }, { status: 401 });

const forbidden = (message = "Forbidden") =>
  Response.json({ success: false, error: message }, { status: 403 });

const parsePrivilegedEmails = () =>
  (process.env.ADMIN_PRIVILEGED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export async function requireAuth(request: NextRequest): Promise<AuthContext | Response> {
  const cookieStore = await cookies();
  const cookieClient = createServerClient(cookieStore);
  const bearerToken = parseBearerToken(request);

  if (bearerToken) {
    const bearerClient = createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    });

    const {
      data: { user },
      error,
    } = await bearerClient.auth.getUser(bearerToken);

    if (error || !user) {
      return unauthorized("Invalid or expired token");
    }

    return { user, supabase: bearerClient, accessToken: bearerToken };
  }

  const {
    data: { user },
    error,
  } = await cookieClient.auth.getUser();

  if (error || !user) {
    return unauthorized("Missing authentication token");
  }

  return { user, supabase: cookieClient, accessToken: null };
}

export async function requireAdminAuth(request: NextRequest): Promise<AuthContext | Response> {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const privilegedEmails = parsePrivilegedEmails();
  const email = auth.user.email?.toLowerCase() ?? "";
  if (email && privilegedEmails.includes(email)) {
    return auth;
  }

  const { data: profileById, error } = await auth.supabase
    .from("profiles")
    .select("role, status")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return forbidden("Unable to validate role");
  }

  let profile = profileById as { role?: string; status?: string } | null;
  if (!profile?.role && email) {
    const { data: profileByEmail, error: profileByEmailError } = await auth.supabase
      .from("profiles")
      .select("role, status")
      .ilike("email", email)
      .maybeSingle();

    if (profileByEmailError) {
      return forbidden("Unable to validate role");
    }

    profile = (profileByEmail as { role?: string; status?: string } | null) ?? profile;
  }

  const role = String(profile?.role ?? "").toLowerCase();
  const status = String(profile?.status ?? "active").toLowerCase();

  if (status && status !== "active") {
    return forbidden("Account is not active");
  }

  if (!["admin", "super_admin"].includes(role)) {
    return forbidden("Insufficient permissions");
  }

  return auth;
}
