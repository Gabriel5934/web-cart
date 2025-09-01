import { createContext } from "react";
import { User } from "./firebase/users/types";

interface IContext {
  auth: { setUser: (user: User | null) => void; user: User | null };
}

export const Context = createContext<IContext>({
  auth: { setUser: (user: User | null) => console.log(user), user: null },
});
