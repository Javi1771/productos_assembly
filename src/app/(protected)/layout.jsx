// app/(protected)/layout.jsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function ProtectedLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  const valid = token ? await verifySession(token) : null;
  if (!valid) {
    redirect("/login");
  }

  return <>{children}</>;
}
