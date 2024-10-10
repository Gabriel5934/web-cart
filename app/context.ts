import { AlertColor } from "@mui/material";
import { createContext } from "react";

export interface SnackbarProps {
  severity: AlertColor;
  message: string;
  error: string;
}

export const Context = createContext({
  openSnackBar: (props: SnackbarProps) => console.log(props),
});
