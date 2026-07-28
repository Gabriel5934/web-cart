import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
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

const routes = ["/inicio"] as const;

export const Route = createFileRoute("/_bottomNav")({
  component: BottomNavLayout,
});

function BottomNavLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pathIndex = routes.indexOf(pathname as (typeof routes)[number]);
  const [tab, setTab] = useState(pathIndex);
  const context = useContext(Context);
  const authEnabled = context.congregation.data?.auth;

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
      !context.auth.user &&
      authEnabled
    ) {
      navigate({ to: "/" });
    } else if (
      context.auth.user &&
      !context.phoneBook.loading &&
      !context.phoneBook.entry &&
      authEnabled
    ) {
      navigate({ to: "/complete-profile" });
    }
  }, [
    context.auth.loading,
    context.auth.user,
    context.phoneBook.entry,
    context.phoneBook.loading,
    navigate,
    authEnabled,
  ]);

  if (
    context.auth.loading ||
    context.congregation.loading ||
    !context.congregation.data ||
    context.phoneBook.loading ||
    (authEnabled && (!context.auth.user || !context.phoneBook.entry))
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
          bottom: import.meta.env.DEV ? "50px" : 0,
          left: 0,
          right: 0,
        }}
        elevation={3}
        className="z-50"
      >
        <BottomNavigation showLabels value={tab} onChange={changeTab}>
          <BottomNavigationAction label="Início" icon={<HomeIcon />} />
          {authEnabled && context.auth.user && (
            <BottomNavigationAction label="Sair" icon={<LogoutIcon />} />
          )}
        </BottomNavigation>
      </Paper>
    </>
  );
}
