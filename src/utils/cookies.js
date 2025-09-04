/* eslint-disable @typescript-eslint/no-unused-vars */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function getUserRoleFromCookie() {
  const raw = getCookie("u_rol"); //* se guardó como texto (ej: "1", "2")
  if (!raw) return null;
  //* normaliza a string "1"/"2"
  return String(raw).trim();
}
