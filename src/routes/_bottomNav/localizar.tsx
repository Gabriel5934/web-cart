import { createFileRoute } from "@tanstack/react-router";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { useBookings } from "@/firebase/bookings/controller";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useContext } from "react";
import { Context } from "@/context";

export const Route = createFileRoute("/_bottomNav/localizar")({
  component: LocalizarPage,
});

function LocalizarPage() {
  const { lastBookings, loading } = useBookings(false, true);
  const { devices: congregationDevices = [] } =
    useContext(Context).congregation.data ?? {};

  const devices = Object.keys(lastBookings).filter((key) =>
    congregationDevices.includes(key),
  );

  return (
    <>
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
        className="px-4 pt-20 pb-4"
      >
        <Typography variant="h4">Localizar</Typography>
      </Box>
      <Box sx={{ padding: 4 }}>
        {loading ? (
          <Skeleton height={200} width={"100%"} count={3} />
        ) : (
          <Stack spacing={1}>
            <Alert severity="info">
              {
                'Para informar que você devolveu o carrinho ou display no salão, clique na sua reserva na tela de Início e depois em "Devolver"'
              }
            </Alert>
            {devices.map((key) => (
              <Paper
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
                key={key}
                className="flex flex-col p-4 rounded-md w-full"
              >
                <Stack spacing={1}>
                  <Typography variant="h5">{key}</Typography>
                  <Box>
                    <Typography>{`Usado por último por: ${
                      lastBookings[key]?.name ?? "Ninguém"
                    }`}</Typography>
                    <Typography>{`${
                      lastBookings[key]?.date.format("DD/MM/YYYY, HH:mm") ?? ""
                    }`}</Typography>
                  </Box>
                  <Typography>
                    Retornado ao salão? <br />
                    {lastBookings[key]?.returned ? "Sim" : "Não"}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </>
  );
}
