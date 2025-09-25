import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "../lib";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect("/inicio");
  }

  return <>{children}</>;
}
