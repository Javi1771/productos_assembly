import { SignJWT, jwtVerify } from "jose";

const DEFAULT_MAX_AGE = 60 * 60 * 8; //* 8 horas
const secret = process.env.AUTH_SECRET || "dev-secret-please-change";
const key = new TextEncoder().encode(secret);

export async function signSession(payload, { maxAge = DEFAULT_MAX_AGE } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAge)
    .sign(key);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload; //* { sub, email, iat, exp, ... }
  } catch {
    return null;
  }
}
