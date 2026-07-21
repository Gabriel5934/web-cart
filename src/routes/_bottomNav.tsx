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
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useContext, useEffect, useState } from "react";
import { Context } from "@/context";
import { getConstants } from "@/consts";

const routes = ["/inicio", "/localizar", "/reservar"] as const;

export const Route = createFileRoute("/_bottomNav")({
  component: BottomNavLayout,
});

function BottomNavLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pathIndex = routes.indexOf(pathname as (typeof routes)[number]);
  const [tab, setTab] = useState(pathIndex);
  const context = useContext(Context);
  const { AUTH } = getConstants();

  const changeTab = (_event: unknown, tab: number) => {
    setTab(tab);
    navigate({ to: routes[tab] });
  };

  useEffect(() => {
    setTab(pathIndex);
  }, [pathIndex]);

  useEffect(() => {
    if (!context.auth.user && AUTH) {
      navigate({ to: "/" });
    }
  }, [context.auth.user, navigate, AUTH]);

  if (!context.auth.user && AUTH) {
    return (
      <Backdrop onClick={() => {}} open>
        <CircularProgress />
      </Backdrop>
    );
  }

  return (
    <>
      <Outlet />
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
        className="z-50"
      >
        <BottomNavigation showLabels value={tab} onChange={changeTab}>
          <BottomNavigationAction label="Início" icon={<HomeIcon />} />
          <BottomNavigationAction label="Localizar" icon={<LocationOnIcon />} />
          <BottomNavigationAction label="Reservar" icon={<AddIcon />} />
        </BottomNavigation>
      </Paper>
    </>
  );
}
