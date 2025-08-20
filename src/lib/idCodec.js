// Base64 URL-safe para usar en la URL (ofuscación simple, no seguridad)

function toBase64Url(b64) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(url) {
  return url.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeItemId(val) {
  if (val == null) return "";
  const str = String(val);

  // Node
  if (typeof window === "undefined") {
    return Buffer.from(str, "utf8").toString("base64url");
  }

  // Browser
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return toBase64Url(btoa(bin));
}

export function decodeItemId(token) {
  // Normaliza token (puede venir undefined o como array)
  const t = Array.isArray(token) ? token[0] : token;
  if (!t || typeof t !== "string") return null;

  try {
    // Node
    if (typeof window === "undefined") {
      const s = Buffer.from(t, "base64url").toString("utf8");
      const n = Number.parseInt(s, 10);
      return Number.isNaN(n) ? null : n;
    }

    // Browser
    const b64 = fromBase64Url(t);
    // padding para atob si hace falta
    const pad = b64.length % 4 === 2 ? "==" : b64.length % 4 === 3 ? "=" : "";
    const bin = atob(b64 + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const s = new TextDecoder().decode(bytes);
    const n = Number.parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  } catch {
    return null;
  }
}
