import { User } from "firebase/auth";
import { createContext } from "react";

interface IContext {
  auth: { setUser: (user: User | null) => void; user: User | null };
}

export const Context = createContext<IContext>({
  auth: { setUser: (user: User | null) => console.log(user), user: null },
});
