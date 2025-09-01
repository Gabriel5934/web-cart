import { AlertColor } from "@mui/material";
import { User } from "firebase/auth";
import { createContext } from "react";

export interface SnackbarProps {
  severity: AlertColor;
  message: string;
  error: string;
}

interface IContext {
  openSnackBar: (props: SnackbarProps) => void;
  auth: { setUser: (user: User | null) => void; user: User | null };
}

export const Context = createContext<IContext>({
  openSnackBar: (props: SnackbarProps) => console.log(props),
  auth: { setUser: (user: User | null) => console.log(user), user: null },
});
