import { useContext, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Alert,
  AppBar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CongregationScheduleForm from "@/components/CongregationScheduleForm";
import CongregationAnnouncementForm from "@/components/CongregationAnnouncementForm";
import { Context } from "@/context";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const context = useContext(Context);
  const navigate = useNavigate();
  const profile = context.phoneBook.entry;
  const isAdmin = profile?.role === "admin";
  const loading =
    context.auth.loading ||
    context.phoneBook.loading ||
    (Boolean(profile) && context.congregation.loading);
  const hasError = Boolean(
    context.phoneBook.error || context.congregation.error,
  );

  useEffect(() => {
    if (loading || hasError) return;

    if (!context.auth.user) {
      navigate({ to: "/", replace: true });
    } else if (!isAdmin) {
      navigate({ to: "/inicio", replace: true });
    }
  }, [context.auth.user, hasError, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <Backdrop open>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (hasError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          Não foi possível carregar os dados administrativos. Atualize a página
          e tente novamente.
        </Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Backdrop open>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppBar elevation={0} position="static">
        <Toolbar sx={{ minHeight: { md: 72 } }}>
          <Container
            maxWidth="lg"
            disableGutters
            sx={{ display: "flex", alignItems: "center" }}
          >
            <SettingsOutlinedIcon sx={{ mr: 1.5 }} />
            <Typography component="h1" variant="h6" sx={{ flexGrow: 1 }}>
              Administração
            </Typography>
            <Button
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Voltar ao painel
            </Button>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography component="p" variant="h4" fontWeight={700}>
              Configurações da congregação
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {context.congregation.data?.name}
            </Typography>
          </Box>
          <CongregationAnnouncementForm />
          <CongregationScheduleForm />
        </Stack>
      </Container>
    </Box>
  );
}
