import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Alert,
  Backdrop,
  Box,
  CircularProgress,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useContext, useEffect, useState } from "react";
import { Context } from "@/context";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebase";

const routes = [
  { path: "/inicio", label: "Início", icon: <HomeIcon /> },
  { path: "/localizar", label: "Localizar", icon: <LocationOnIcon /> },
  { path: "/reservar", label: "Reservar", icon: <EventAvailableIcon /> },
] as const;

export const Route = createFileRoute("/_bottomNav")({
  component: BottomNavLayout,
});

function BottomNavLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const context = useContext(Context);
  const navigationRoutes = context.phoneBook.entry?.role === "admin"
    ? [
        ...routes,
        {
          path: "/dashboard" as const,
          label: "Painel",
          icon: <DashboardOutlinedIcon />,
        },
      ]
    : routes;
  const pathIndex = navigationRoutes.findIndex(
    (route) => route.path === pathname,
  );
  const [tab, setTab] = useState(pathIndex);

  const changeTab = (_event: unknown, tab: number) => {
    if (tab === navigationRoutes.length) {
      void logout();
      return;
    }

    setTab(tab);
    navigate({ to: navigationRoutes[tab].path });
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Não foi possível sair. Tente novamente.");
    }
  };

  useEffect(() => {
    setTab(pathIndex);
  }, [pathIndex]);

  useEffect(() => {
    if (
      !context.auth.loading &&
      !context.phoneBook.loading &&
      !context.auth.user
    ) {
      navigate({ to: "/" });
    } else if (
      context.auth.user &&
      !context.phoneBook.loading &&
      !context.phoneBook.entry &&
      !context.phoneBook.error
    ) {
      navigate({ to: "/complete-profile" });
    }
  }, [
    context.auth.loading,
    context.auth.user,
    context.phoneBook.entry,
    context.phoneBook.error,
    context.phoneBook.loading,
    navigate,
  ]);

  if (context.phoneBook.error || context.congregation.error) {
    return (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          minHeight: "100vh",
          px: 2,
        }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          Não foi possível carregar os dados do usuário ou da congregação.
          Atualize a página e tente novamente.
        </Alert>
      </Box>
    );
  }

  if (
    context.auth.loading ||
    context.congregation.loading ||
    !context.congregation.data ||
    context.phoneBook.loading ||
    !context.auth.user ||
    !context.phoneBook.entry
  ) {
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
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        }}
        elevation={3}
        className="z-50"
      >
        <BottomNavigation showLabels value={tab} onChange={changeTab}>
          {navigationRoutes.map((route) => (
            <BottomNavigationAction
              key={route.path}
              label={route.label}
              icon={route.icon}
            />
          ))}
          <BottomNavigationAction label="Sair" icon={<LogoutIcon />} />
        </BottomNavigation>
      </Paper>
    </>
  );
}
