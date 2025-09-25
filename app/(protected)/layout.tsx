import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "../lib";
import { ContextProvider } from "../context";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <ContextProvider value={{ user: session }}>{children}</ContextProvider>
  );
}
