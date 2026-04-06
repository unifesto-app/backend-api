import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const DEVICE_ID_COOKIE_NAME = "uf_device_id";
const DEVICE_ID_LENGTH = 10;
const TEN_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 10;

export const DEVICE_ID_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TEN_YEARS_IN_SECONDS,
};

export const isValidDeviceId = (value: string | undefined | null): value is string => {
  return typeof value === "string" && /^\d{10}$/.test(value);
};

export const generateDeviceId = () => {
  const randomBuffer = new Uint8Array(DEVICE_ID_LENGTH);
  crypto.getRandomValues(randomBuffer);

  return Array.from(randomBuffer, (value) => String(value % 10)).join("");
};

export const getOrCreateDeviceId = (candidate: string | undefined | null) => {
  if (isValidDeviceId(candidate)) {
    return candidate;
  }

  return generateDeviceId();
};
