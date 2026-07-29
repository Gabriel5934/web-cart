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

  const changeTab = (_event: unknown, tab: number) => {
    if (tab === routes.length) {
      void logout();
      return;
    }

    setTab(tab);
    navigate({ to: routes[tab] });
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
          <BottomNavigationAction label="Início" icon={<HomeIcon />} />
          <BottomNavigationAction label="Localizar" icon={<LocationOnIcon />} />
          <BottomNavigationAction
            label="Reservar"
            icon={<EventAvailableIcon />}
          />
          <BottomNavigationAction label="Sair" icon={<LogoutIcon />} />
        </BottomNavigation>
      </Paper>
    </>
  );
}
