"use client";

import "./globals.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Snackbar,
  Alert,
  AlertColor,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { createContext, Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import LocationOnIcon from "@mui/icons-material/LocationOn";

interface SnackbarProps {
  severity: AlertColor;
  message: string;
  error: string;
}

export const Context = createContext({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openSnackBar: (props: SnackbarProps) => {},
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const routes = ["/", "/localizar", "/reservar"];
  const router = useRouter();
  const pathname = usePathname();
  const pathIndex = routes.indexOf(pathname);
  const [tab, setTab] = useState(pathIndex);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarProps, setSnackBarProps] = useState<SnackbarProps>({
    severity: "info",
    message: "",
    error: "",
  });

  const changeTab = (_event: unknown, tab: number) => {
    setTab(tab);
    router.push(routes[tab]);
  };

  const closeSnackBar = () => {
    setShowSnackBar(false);
  };

  const openSnackBar = (props: SnackbarProps) => {
    setSnackBarProps(props);
    setShowSnackBar(true);
  };

  useEffect(() => {
    setTab(pathIndex);
  }, [pathIndex]);

  return (
    <html lang="en">
      <head>
        <title>Jardim Esplanada</title>
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
          <Suspense>
            <Context.Provider value={{ openSnackBar }}>
              {children}
            </Context.Provider>
          </Suspense>
        </div>
        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
          elevation={3}
          className="z-50"
        >
          <BottomNavigation showLabels value={tab} onChange={changeTab}>
            <BottomNavigationAction label="Início" icon={<HomeIcon />} />
            <BottomNavigationAction
              label="Localizar"
              icon={<LocationOnIcon />}
            />
            <BottomNavigationAction label="Reservar" icon={<AddIcon />} />
          </BottomNavigation>
        </Paper>
      </body>
    </html>
  );
}
