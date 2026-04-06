import { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  DEVICE_ID_COOKIE_NAME,
  isValidDeviceId,
} from "@/lib/tracking/device-id";

type TrackViewPayload = {
  view?: string;
  metadata?: Record<string, unknown>;
};

const MISSING_TABLE_ERROR =
  "Tracking table app_trackers is missing. Create it before using this endpoint.";

const readDeviceId = async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const candidate =
    cookieStore.get(DEVICE_ID_COOKIE_NAME)?.value ??
    headerStore.get("x-device-id") ??
    null;

  if (!isValidDeviceId(candidate)) {
    return null;
  }

  return candidate;
};

const tableMissing = (error: { code?: string; message?: string } | null) => {
  if (!error) {
    return false;
  }

  return error.code === "42P01" || error.message?.includes("app_trackers") === true;
};

export async function GET(req: NextRequest) {
  const deviceId = await readDeviceId();
  if (!deviceId) {
    return Response.json(
      { success: false, error: "Valid 10-digit device ID is required." },
      { status: 400 }
    );
  }

  const supabase = createClient(await cookies());
  const { searchParams } = req.nextUrl;
  const limit = Number(searchParams.get("limit") ?? 200);

  const { data, error } = await supabase
    .from("app_trackers")
    .select("id, device_id, view, view_count, first_seen_at, last_seen_at, metadata")
    .eq("device_id", deviceId)
    .order("last_seen_at", { ascending: false })
    .limit(Math.min(limit, 1000));

  if (tableMissing(error)) {
    return Response.json({ success: false, error: MISSING_TABLE_ERROR }, { status: 500 });
  }

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    device_id: deviceId,
    total_unique_views: data?.length ?? 0,
    data: data ?? [],
  });
}

export async function POST(req: NextRequest) {
  const deviceId = await readDeviceId();
  if (!deviceId) {
    return Response.json(
      { success: false, error: "Valid 10-digit device ID is required." },
      { status: 400 }
    );
  }

  const supabase = createClient(await cookies());
  const body = (await req.json()) as TrackViewPayload;
  const view = body.view?.trim();

  if (!view) {
    return Response.json({ success: false, error: "view is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const userAgent = (await headers()).get("user-agent") ?? "unknown";

  const { data: existing, error: existingError } = await supabase
    .from("app_trackers")
    .select("id, view_count")
    .eq("device_id", deviceId)
    .eq("view", view)
    .maybeSingle();

  if (tableMissing(existingError)) {
    return Response.json({ success: false, error: MISSING_TABLE_ERROR }, { status: 500 });
  }

  if (existingError) {
    return Response.json({ success: false, error: existingError.message }, { status: 500 });
  }

  if (existing) {
    const { data, error } = await supabase
      .from("app_trackers")
      .update({
        view_count: (existing.view_count ?? 0) + 1,
        last_seen_at: now,
        metadata: {
          ...(body.metadata ?? {}),
          user_agent: userAgent,
        },
      })
      .eq("id", existing.id)
      .select("id, device_id, view, view_count, first_seen_at, last_seen_at, metadata")
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, unique_view: false, data });
  }

  const { data, error } = await supabase
    .from("app_trackers")
    .insert({
      device_id: deviceId,
      view,
      view_count: 1,
      first_seen_at: now,
      last_seen_at: now,
      metadata: {
        ...(body.metadata ?? {}),
        user_agent: userAgent,
      },
    })
    .select("id, device_id, view, view_count, first_seen_at, last_seen_at, metadata")
    .single();

  if (tableMissing(error)) {
    return Response.json({ success: false, error: MISSING_TABLE_ERROR }, { status: 500 });
  }

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, unique_view: true, data }, { status: 201 });
}
