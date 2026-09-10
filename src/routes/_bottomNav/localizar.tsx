import { createFileRoute } from "@tanstack/react-router";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useBookings } from "@/firebase/bookings/controller";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useContext, useState } from "react";
import { Context } from "@/context";
import toast from "react-hot-toast";

export const Route = createFileRoute("/_bottomNav/localizar")({
  component: LocalizarPage,
});

function LocalizarPage() {
  const { lastBookings, loading, refresh, toggleReturned } = useBookings(
    false,
    true,
  );
  const context = useContext(Context);
  const { devices: congregationDevices = [] } = context.congregation.data ?? {};
  const isAdmin = context.phoneBook.entry?.role === "admin";
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null,
  );

  const devices = Object.keys(lastBookings).filter((key) =>
    congregationDevices.includes(key),
  );

  const handleReturnedToggle = async (bookingId: string) => {
    try {
      setUpdatingBookingId(bookingId);
      await toggleReturned(bookingId);
      await refresh();
    } catch (error) {
      console.error("Error updating booking return status:", error);
      toast.error("Não foi possível atualizar a devolução. Tente novamente.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

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
                'Para informar que você devolveu o carrinho ou display no salão, use "Devolver" na seção "Minhas Reservas".'
              }
            </Alert>
            {devices.map((key) => {
              const booking = lastBookings[key];

              return (
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
                        booking?.name ?? "Ninguém"
                      }`}</Typography>
                      <Typography>{`${
                        booking?.date.format("DD/MM/YYYY, HH:mm") ?? ""
                      }`}</Typography>
                    </Box>
                    <Typography>
                      Retornado ao salão? <br />
                      {booking?.returned ? "Sim" : "Não"}
                    </Typography>
                    {isAdmin && booking && (
                      <Button
                        color="secondary"
                        disabled={updatingBookingId === booking.id}
                        onClick={() => void handleReturnedToggle(booking.id)}
                        variant="contained"
                      >
                        {booking.returned
                          ? "Marcar como não devolvido"
                          : "Marcar como devolvido"}
                      </Button>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </>
  );
}
