import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import {
  DEVICE_ID_COOKIE_NAME,
  DEVICE_ID_COOKIE_OPTIONS,
  getOrCreateDeviceId,
} from "@/lib/tracking/device-id";

const getAllowedOrigin = (origin: string | null) => {
  if (!origin) {
    return null;
  }

  const configured = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL ?? "http://localhost:3000";
  return origin === configured ? origin : null;
};

const attachCorsHeaders = (request: NextRequest, response: NextResponse) => {
  const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
  if (!allowedOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.headers.set("Vary", "Origin");
  return response;
};

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return attachCorsHeaders(request, new NextResponse(null, { status: 204 }));
  }

  const response = createClient(request);
  const existingDeviceId = request.cookies.get(DEVICE_ID_COOKIE_NAME)?.value;
  const deviceId = getOrCreateDeviceId(existingDeviceId);

  if (deviceId !== existingDeviceId) {
    response.cookies.set(DEVICE_ID_COOKIE_NAME, deviceId, DEVICE_ID_COOKIE_OPTIONS);
  }

  response.headers.set("x-device-id", deviceId);
  return attachCorsHeaders(request, response);
}

export const config = {
  matcher: ["/api/:path*"],
};
