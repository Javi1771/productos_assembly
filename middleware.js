import { NextResponse } from "next/server";

export const config = {
  //* Protege /assembly/** y también intercepta /login para limpiar cookie
  matcher: ["/login", "/assembly/:path*"],
};

export function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;
  const hasSession = !!req.cookies.get("session")?.value;

  //! Al llegar a /login, borra la cookie de sesión (server-side)
  if (pathname === "/login") {
    const res = NextResponse.next();
    if (hasSession) {
      res.cookies.set("session", "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0), //! mata la cookie
      });
    }
    return res;
  }

  //? Rutas protegidas (/assembly/**)
  if (pathname.startsWith("/assembly")) {
    if (!hasSession) {
      url.pathname = "/login";
      url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
