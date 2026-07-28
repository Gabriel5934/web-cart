import React from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import { useMemo } from "react";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./globals.css";

import { routeTree } from "./routeTree.gen";
import { createAppTheme } from "./theme";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
    defaultMatches: false,
    noSsr: true,
  });
  const theme = useMemo(
    () => createAppTheme(prefersDarkMode ? "dark" : "light"),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
