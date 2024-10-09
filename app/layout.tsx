"use client";

import "./globals.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const routes = ["/", "/reservar"];
  const router = useRouter();
  const pathname = usePathname();
  const pathIndex = routes.indexOf(pathname);
  const [tab, setTab] = useState(pathIndex);

  const changeTab = (_event: unknown, tab: number) => {
    setTab(tab);
    router.push(routes[tab]);
  };

  useEffect(() => {
    setTab(pathIndex);
  }, [pathIndex]);

  return (
    <html lang="en">
      <body>
        <div className="mb-16">{children}</div>
        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
          elevation={3}
          className="z-50"
        >
          <BottomNavigation showLabels value={tab} onChange={changeTab}>
            <BottomNavigationAction label="Início" icon={<HomeIcon />} />
            <BottomNavigationAction label="Reservar" icon={<AddIcon />} />
          </BottomNavigation>
        </Paper>
      </body>
    </html>
  );
}
