"use client";

import "./globals.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Snackbar, Alert, Button, Stack, Typography } from "@mui/material";
import { Suspense, useState } from "react";
import { Context, SnackbarProps } from "./context";
import { User } from "firebase/auth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarProps, setSnackBarProps] = useState<SnackbarProps>({
    severity: "info",
    message: "",
    error: "",
  });
  const [user, setUser] = useState<User | null>(null);

  const closeSnackBar = () => {
    setShowSnackBar(false);
  };

  const openSnackBar = (props: SnackbarProps) => {
    setSnackBarProps(props);
    setShowSnackBar(true);
  };

  return (
    <html lang="en">
      <head>
        <title>Web Cart</title>
      </head>
      <body>
        <Snackbar
          open={showSnackBar}
          autoHideDuration={6000}
          onClose={closeSnackBar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={closeSnackBar}
            severity={snackBarProps.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            <Stack spacing={1}>
              <Typography>{snackBarProps.message}</Typography>
              {snackBarProps.severity === "error" && (
                <Button
                  variant="contained"
                  size="small"
                  color="warning"
                  onClick={() =>
                    navigator.clipboard.writeText(snackBarProps.error)
                  }
                >
                  copiar erro
                </Button>
              )}
            </Stack>
          </Alert>
        </Snackbar>
        <div className="mb-16">
          <Context.Provider value={{ openSnackBar, auth: { user, setUser } }}>
            <Suspense>{children}</Suspense>
          </Context.Provider>
        </div>
      </body>
    </html>
  );
}
