"use client";

import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Backdrop,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Context } from "../context";
import { getConstants } from "../consts";

export default function WithLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const routes = ["/inicio", "/localizar", "/reservar"];
  const router = useRouter();
  const pathname = usePathname();
  const pathIndex = routes.indexOf(pathname);
  const [tab, setTab] = useState(pathIndex);
  const context = useContext(Context);
  const { AUTH } = getConstants();

  const changeTab = (_event: unknown, tab: number) => {
    setTab(tab);
    router.push(routes[tab]);
  };

  useEffect(() => {
    setTab(pathIndex);
  }, [pathIndex]);

  useEffect(() => {
    if (!context.auth.user && AUTH) {
      router.push("/");
    }
  }, [context.auth.user, router, AUTH]);

  if (!context.auth.user && AUTH) {
    return (
      <Backdrop onClick={() => {}} open>
        <CircularProgress />
      </Backdrop>
    );
  } else {
    return (
      <>
        {children}
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
      </>
    );
  }
}
