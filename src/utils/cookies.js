export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

export function getUserRoleFromCookie() {
  const raw = getCookie("u_rol"); //* "1", "2", etc
  if (!raw) return null;
  return String(raw).trim();
}

//* Nuevo: lee la nómina (ID del aprobador)
export function getUserIdFromCookie() {
  const raw = getCookie("u_nomina") || getCookie("u_id");
  if (!raw) return null;
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}
