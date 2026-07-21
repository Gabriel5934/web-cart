import { createFileRoute } from "@tanstack/react-router";
import { useBookings } from "@/firebase/bookings/controller";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/relatorio")({
  component: RelatorioPage,
});

function RelatorioPage() {
  const { uniqueUsers, bookingsWithinWindow } = useBookings(false, false, 180);

  return (
    <div className="py-4 px-2">
      <div className="flex flex-col gap-2">
        <Paper
          sx={{
            bgcolor: "primary.main",
            color: "white",
          }}
          className="flex flex-col p-4 rounded-md text-white w-full"
        >
          <Typography variant="subtitle1">
            Quem usou o carrinho / display nos últimos 6 meses
          </Typography>
        </Paper>

        <TableContainer component={Paper} sx={{ maxHeight: 285 }}>
          <Table size="small" aria-label="reservas">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uniqueUsers.map((user) => (
                <TableRow key={user}>
                  <TableCell>{user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <hr className="my-4" />

      <div className="flex flex-col gap-2">
        <Paper
          sx={{
            bgcolor: "primary.main",
            color: "white",
          }}
          className="flex flex-col p-4 rounded-md text-white w-full"
        >
          <Typography variant="subtitle1">
            Relatório completo dos últimos 6 meses
          </Typography>
        </Paper>

        <TableContainer component={Paper} sx={{ maxHeight: 285 }}>
          <Table size="small" aria-label="reservas">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell align="center">Data</TableCell>
                <TableCell align="center">Devolvido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookingsWithinWindow.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    {booking.name}
                    <br />
                    {booking.device}
                    <br />
                    {booking.place}
                  </TableCell>
                  <TableCell align="center">
                    {booking.date.format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell align="center">
                    {booking.returned ? "Sim" : "Não"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
