import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import {
  DEVICE_ID_COOKIE_NAME,
  DEVICE_ID_COOKIE_OPTIONS,
  getOrCreateDeviceId,
} from "@/lib/tracking/device-id";

const MAX_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000;

type IpGuardState = {
  attempts: number;
  blockedUntil: number;
  updatedAt: number;
};

const ipGuardStore = new Map<string, IpGuardState>();

const PROD_ALLOWED_ORIGINS = [
  "https://today.unifesto.app",
  "https://www.unifesto.app",
  "https://org.unifesto.app",
  "https://checkin.unifesto.app",
  "https://events.unifesto.app",
  "https://admin.unifesto.app",
];

const DEV_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip") ?? "unknown";
};

const cleanupIpGuardStore = (now: number) => {
  for (const [ip, state] of ipGuardStore.entries()) {
    const stale = now - state.updatedAt > BLOCK_DURATION_MS;
    const unblockedAndOld = state.blockedUntil <= now && state.attempts <= 0;
    if (stale || unblockedAndOld) {
      ipGuardStore.delete(ip);
    }
  }
};

const prohibitedResponse = () =>
  new NextResponse("You are prohibited only", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });

const shouldBlockIp = (request: NextRequest) => {
  const now = Date.now();
  cleanupIpGuardStore(now);

  const ip = getClientIp(request);
  const state = ipGuardStore.get(ip) ?? {
    attempts: 0,
    blockedUntil: 0,
    updatedAt: now,
  };

  if (state.blockedUntil > now) {
    state.updatedAt = now;
    ipGuardStore.set(ip, state);
    return true;
  }

  if (state.blockedUntil <= now && state.blockedUntil !== 0) {
    state.attempts = 0;
    state.blockedUntil = 0;
  }

  state.attempts += 1;
  state.updatedAt = now;

  if (state.attempts > MAX_ATTEMPTS) {
    state.blockedUntil = now + BLOCK_DURATION_MS;
    ipGuardStore.set(ip, state);
    return true;
  }

  ipGuardStore.set(ip, state);
  return false;
};

const getAllowedOrigin = (origin: string | null) => {
  if (!origin) {
    return null;
  }

  const isProd = process.env.NODE_ENV === "production";
  const configuredOrigins = [
    process.env.CORS_ALLOWED_ORIGINS,
    ...PROD_ALLOWED_ORIGINS,
    ...(isProd ? [] : DEV_ALLOWED_ORIGINS),
  ]
    .filter(Boolean)
    .flatMap((value) =>
      String(value)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    );

  return configuredOrigins.includes(origin) ? origin : null;
};

const forbiddenOriginResponse = (origin: string) => {
  console.warn(`[cors] Rejected origin: ${origin}`);
  return NextResponse.json({ success: false, error: "Origin not allowed" }, { status: 403 });
};

const attachCorsHeaders = (request: NextRequest, response: NextResponse) => {
  const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
  if (!allowedOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, x-device-id, x-client-info, apikey"
  );
  response.headers.set("Vary", "Origin");
  return response;
};

export async function middleware(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(origin);

  if (isApiRoute && origin && !allowedOrigin) {
    return forbiddenOriginResponse(origin);
  }

  // IP guard should not throttle normal API usage.
  if (!isApiRoute && shouldBlockIp(request)) {
    if (!request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/blocked", request.url));
    }

    return attachCorsHeaders(request, prohibitedResponse());
  }

  if (request.method === "OPTIONS") {
    return attachCorsHeaders(request, new NextResponse(null, { status: 200 }));
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
  matcher: ["/", "/api/:path*"],
};
