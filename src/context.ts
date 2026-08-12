import { createContext } from "react";
import type { User } from "firebase/auth";
import type { Congregation } from "@/firebase/congregation/types";
import type { PhoneBookEntry } from "@/firebase/phonebook/types";

export type { Congregation } from "@/firebase/congregation/types";
export type { PhoneBookEntry } from "@/firebase/phonebook/types";

interface IContext {
  auth: {
    loading: boolean;
    setUser: (user: User | null) => void;
    user: User | null;
  };
  phoneBook: {
    entry: PhoneBookEntry | null;
    error: Error | null;
    loading: boolean;
    setEntry: (entry: PhoneBookEntry | null) => void;
  };
  congregation: {
    data: Congregation | null;
    error: Error | null;
    loading: boolean;
    setData: (congregation: Congregation | null) => void;
  };
}

export const Context = createContext<IContext>({
  auth: {
    loading: true,
    setUser: () => undefined,
    user: null,
  },
  phoneBook: {
    entry: null,
    error: null,
    loading: true,
    setEntry: () => undefined,
  },
  congregation: {
    data: null,
    error: null,
    loading: true,
    setData: () => undefined,
  },
});
