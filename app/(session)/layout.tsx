"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ContextProvider } from "../context";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "../helpers";
import { UserDoc } from "../firebase/users/types";
import { Backdrop, CircularProgress } from "@mui/material";

export default function SessionLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<UserDoc | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    setLoading(false);

    if (!currentSession && pathname !== "/") {
      router.push("/");
    }

    if (currentSession && pathname === "/") {
      router.push("/inicio");
    }
  }, [router, pathname]);

  if (loading) {
    return (
      <Backdrop open={true}>
        <CircularProgress />
      </Backdrop>
    );
  }

  return (
    <ContextProvider value={{ user: session }}>{children}</ContextProvider>
  );
}
