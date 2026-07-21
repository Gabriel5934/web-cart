import { Suspense, useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { Context } from "@/context";
import { User } from "@/firebase/users/types";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <>
      <Toaster />
      <div className="mb-16">
        <Context.Provider value={{ auth: { user, setUser } }}>
          <Suspense>
            <Outlet />
          </Suspense>
        </Context.Provider>
      </div>
    </>
  );
}
