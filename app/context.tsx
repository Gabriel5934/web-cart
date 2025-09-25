"use client";

import { createContext } from "react";
import { User } from "./firebase/users/types";

interface IContext {
  user: User | null;
}

export const Context = createContext<IContext>({
  user: null,
});

export function ContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: IContext;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
