import { useContext, useEffect, useId, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import DevicesOtherOutlinedIcon from "@mui/icons-material/DevicesOtherOutlined";
import dayjs from "dayjs";
import { Context } from "@/context";
import { useDashboard } from "@/firebase/dashboard/controller";

export const Route = createFileRoute("/_bottomNav/dashboard")({
  component: DashboardPage,
});

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card sx={{ flex: "1 1 240px" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {label}
            </Typography>
            <Typography component="p" variant="h4" fontWeight={700}>
              {value.toLocaleString("pt-BR")}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const context = useContext(Context);
  const navigate = useNavigate();
  const profile = context.phoneBook.entry;
  const congregation = context.congregation.data;
  const isAdmin = profile?.role === "admin";
  const monthSelectId = useId();
  const [selectedMonth, setSelectedMonth] = useState(
    dayjs().format("YYYY-MM"),
  );
  const {
    registeredUsers,
    ministryHoursThisMonth,
    deviceUsage,
    availableMonths,
    loading,
    error,
  } = useDashboard(
    isAdmin ? profile.congregation : undefined,
    congregation?.devices,
    selectedMonth,
  );

  useEffect(() => {
    if (!context.phoneBook.loading && profile && !isAdmin) {
      navigate({ to: "/inicio", replace: true });
    }
  }, [context.phoneBook.loading, isAdmin, navigate, profile]);

  if (!isAdmin) return null;

  return (
    <>
      <Box
        sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
        className="px-4 pt-20 pb-4"
      >
        <Typography variant="h4" component="h1">
          Painel administrativo
        </Typography>
        <Typography variant="body1">{congregation?.name}</Typography>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        {error ? (
          <Alert severity="error">
            Não foi possível carregar o painel. Atualize a página e tente
            novamente.
          </Alert>
        ) : loading ? (
          <Stack spacing={2}>
            <Skeleton height={120} variant="rounded" />
            <Skeleton height={120} variant="rounded" />
            <Skeleton height={380} variant="rounded" />
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Stack direction="row" flexWrap="wrap" gap={2}>
              <MetricCard
                icon={<PeopleAltOutlinedIcon fontSize="large" />}
                label="Usuários cadastrados"
                value={registeredUsers}
              />
            </Stack>

            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                gap={2}
                sx={{ mb: 2 }}
              >
                <Typography variant="h5" component="h2" fontWeight={700}>
                  Horas e uso dos dispositivos
                </Typography>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel id={`${monthSelectId}-label`}>Mês</InputLabel>
                  <Select
                    id={monthSelectId}
                    label="Mês"
                    labelId={`${monthSelectId}-label`}
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  >
                    {availableMonths.map((month) => (
                      <MenuItem key={month} value={month}>
                        {new Intl.DateTimeFormat("pt-BR", {
                          month: "long",
                          timeZone: "UTC",
                          year: "numeric",
                        }).format(new Date(`${month}-01T00:00:00Z`))}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={2}>
                <MetricCard
                  icon={<AccessTimeOutlinedIcon fontSize="large" />}
                  label="Horas no ministério público"
                  value={ministryHoursThisMonth}
                />
                {Object.entries(deviceUsage).map(([device, usage]) => (
                  <MetricCard
                    key={device}
                    icon={<DevicesOtherOutlinedIcon fontSize="large" />}
                    label={`${device} — reservas`}
                    value={usage}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>
    </>
  );
}
