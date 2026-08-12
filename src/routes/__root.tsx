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

  const {
    entry: phoneBookEntry,
    error: phoneBookError,
    loading: phoneBookLoading,
    setEntry: setPhoneBookEntry,
  } = usePhoneBook(user?.phoneNumber);
  const congregationId = phoneBookEntry?.congregation;
  const {
    congregation,
    error: congregationError,
    loading: congregationLoading,
    setCongregation,
  } =
    useCongregation(congregationId);

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
              error: phoneBookError,
              loading: phoneBookLoading,
              setEntry: setPhoneBookEntry,
            },
            congregation: {
              data: congregation,
              error: congregationError,
              loading: congregationLoading,
              setData: setCongregation,
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
