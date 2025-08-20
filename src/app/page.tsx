"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); //* primera pantalla: login
  }, [router]);

  return null; //! no renderiza contenido
}
