import { Suspense, useEffect, useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { Context } from "@/context";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useCongregation } from "@/firebase/congregation/controller";
import { usePhoneBook } from "@/firebase/phonebook/controller";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const deployCongregationId =
    import.meta.env.VITE_DEPLOY === "esplanada"
      ? "jardim-esplanada"
      : import.meta.env.VITE_DEPLOY;
  const {
    entry: phoneBookEntry,
    loading: phoneBookLoading,
    setEntry: setPhoneBookEntry,
  } = usePhoneBook(user?.phoneNumber);
  const congregationId =
    phoneBookEntry?.congregation ?? deployCongregationId;
  const {
    congregation,
    loading: congregationLoading,
  } = useCongregation(congregationId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <Toaster />
      <div className="mb-16">
        <Context.Provider
          value={{
            auth: { loading: authLoading, user, setUser },
            phoneBook: {
              entry: phoneBookEntry,
              loading: phoneBookLoading,
              setEntry: setPhoneBookEntry,
            },
            congregation: {
              data: congregation,
              loading: congregationLoading,
            },
          }}
        >
          <Suspense>
            <Outlet />
          </Suspense>
        </Context.Provider>
      </div>
    </>
  );
}
