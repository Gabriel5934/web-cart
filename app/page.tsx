"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  Grow,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { db } from "./firebase/firebase";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useSearchParams } from "next/navigation";
import { createRef, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import publicMinistry from "./assets/publicMinistry.jpg";
import Image from "next/image";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useGetBookings } from "./firebase/bookings/controller";

interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs;
  returned: boolean;
}

dayjs.locale("pt-br");
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const SAFE_DELETE_TEXT = "Esplanada";

export default function Page() {
  const searchParams = useSearchParams();
  const { dates, bookingsByDate, loading, refresh } = useGetBookings(
    false,
    true
  );

  const showSnackbar = Boolean(searchParams.get("success"));
  const anchorId = searchParams.get("id") ?? "";

  const anchorRef = createRef<HTMLDivElement>();

  const [snackbarOpen, setSnackbarOpen] = useState(showSnackbar);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBooking, setDrawerBooking] = useState<Booking>();
  const [safeDeleteText, setSafeDeleteText] = useState("");

  const closeSnackbar = () => setSnackbarOpen(false);

  useEffect(() => {
    if (anchorRef.current) {
      const current = anchorRef.current;
      current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [anchorRef]);

  const Booking = (booking: Booking) => {
    const isAnchor = anchorId === booking.id;

    const isPast = booking.date.add(2, "hour").isBefore(dayjs());

    const isCurrent = dayjs().isBetween(
      booking.date,
      booking.date.add(2, "hour")
    );

    const isNext = dayjs().isBetween(
      booking.date,
      booking.date.subtract(2, "hours")
    );

    const showChip = isCurrent || isNext;

    const getChipLabel = () => {
      if (isCurrent) {
        return "Agora";
      } else if (isNext) {
        return dayjs.duration(booking.date.diff(dayjs())).humanize(true);
      }
    };

    const onClick = () => {
      setDrawerOpen(true);
      setDrawerBooking(booking);
    };

    if (isAnchor) {
      return (
        <Grow in={true} timeout={3000}>
          <IconButton onClick={onClick} sx={{ width: "100%" }}>
            <Paper
              sx={{
                bgcolor: "primary.main",
                color: "white",
              }}
              className="flex flex-col p-4 rounded-md text-white w-full"
              id={booking.id}
              ref={anchorRef}
            >
              <Typography variant="body2" className="text-left">
                {booking.device} - {booking.place}
              </Typography>
              <div className="flex gap-4">
                <Typography variant="body1">
                  {booking.date.format("HH:mm")}
                  {" - "}
                  {booking.date.add(2, "hour").format("HH:mm")}
                </Typography>
                <Typography variant="body1">
                  {booking.name} e {booking.partner}
                </Typography>
              </div>
            </Paper>
          </IconButton>
        </Grow>
      );
    } else {
      return (
        <IconButton onClick={onClick} sx={{ width: "100%" }}>
          <Paper
            sx={{
              bgcolor: "primary.main",
              filter: `brightness(${isPast ? 0.5 : 1})`,
              color: "white",
            }}
            className="flex flex-col p-4 rounded-md text-white w-full"
            id={booking.id}
          >
            <div
              className="flex justify-between items-center"
              style={{
                marginBottom: showChip ? 8 : 0,
                textTransform: "capitalize",
              }}
            >
              <Typography variant="body2">
                {booking.device} - {booking.place}
              </Typography>
              {showChip && (
                <Chip label={getChipLabel()} color="warning" size="small" />
              )}
            </div>
            <div className="flex gap-4">
              <Typography variant="body1">
                {booking.date.format("HH:mm")}
                {" - "}
                {booking.date.add(2, "hour").format("HH:mm")}
              </Typography>
              <Typography variant="body1">
                {booking.name} e {booking.partner}
              </Typography>
            </div>
          </Paper>
        </IconButton>
      );
    }
  };

  const deleteBooking = async (id: string) => {
    await deleteDoc(doc(db, "bookings", id));

    setDrawerOpen(false);
    refresh();
  };

  const returnBooking = async (id: string, returned: boolean) => {
    const bookingRef = doc(db, "bookings", id);

    await updateDoc(bookingRef, {
      returned,
    });

    setDrawerOpen(false);
    refresh();
  };

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={closeSnackbar}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
          onClose={closeSnackbar}
        >
          Reserva feita!
        </Alert>
      </Snackbar>
      <Drawer
        open={drawerOpen}
        anchor="bottom"
        onClose={() => {
          setSafeDeleteText("");
          setDrawerOpen(false);
        }}
      >
        <Box
          sx={(theme) => ({
            bgcolor: theme.palette.primary.main,
            color: "white",
          })}
          className="px-4 pt-16 pb-8"
        >
          <div className="flex justify-between items-center capitalize">
            <Typography variant="h6">
              {drawerBooking?.device} - {drawerBooking?.place}
            </Typography>
          </div>
          <div className="flex gap-4">
            <Typography variant="h5">
              {drawerBooking?.date.format("HH:mm")}
              {" - "}
              {drawerBooking?.date.add(2, "hour").format("HH:mm")}
            </Typography>
            <Typography variant="h5">
              {drawerBooking?.name} e {drawerBooking?.partner}
            </Typography>
          </div>
        </Box>
        <Accordion
          disabled={drawerBooking && drawerBooking.date.isAfter(dayjs())}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">Devolver</Typography>
              <Typography>
                {drawerBooking &&
                  drawerBooking.date.isAfter(dayjs()) &&
                  "(Liberado após o fim da reserva)"}
              </Typography>
              {drawerBooking && drawerBooking.returned && (
                <Chip color="success" label="Devolvido" />
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {drawerBooking &&
              (drawerBooking.returned ? (
                <Stack spacing={1}>
                  <Typography>
                    Clique nesse botão apenas se você{" "}
                    <strong> não devolveu</strong> o carrinho no salão
                  </Typography>
                  <Box sx={{ textAlign: "right" }}>
                    <Button
                      variant="contained"
                      onClick={() => returnBooking(drawerBooking.id, false)}
                    >
                      não devolvi
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Typography>
                    Clique nesse botão apenas se você <strong>devolveu</strong>{" "}
                    o carrinho no salão
                  </Typography>
                  <Box sx={{ textAlign: "right" }}>
                    <Button
                      variant="contained"
                      onClick={() => returnBooking(drawerBooking.id, true)}
                    >
                      devolvi
                    </Button>
                  </Box>
                </Stack>
              ))}
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Zona de Perigo</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div className="flex flex-col gap-2">
              <Typography className="mb-2">
                {'Digite "Esplanada" para deletar essa reserva'}
              </Typography>
              <div>
                <TextField
                  label="Digite aqui"
                  size="small"
                  value={safeDeleteText}
                  onChange={(e) => setSafeDeleteText(e.target.value)}
                />
              </div>
              <div>
                <Button
                  color="error"
                  variant="contained"
                  disabled={safeDeleteText !== SAFE_DELETE_TEXT}
                  onClick={() => deleteBooking(drawerBooking?.id ?? "")}
                >
                  deletar
                </Button>
              </div>
            </div>
          </AccordionDetails>
        </Accordion>
      </Drawer>
      <div className="inline-block overflow-hidden relative w-full">
        <Image
          className="pointer-events-none absolute w-full -z-10"
          src={publicMinistry}
          alt="Testemunho público"
          style={{
            filter: "brightness(25%)",
            height: "215px",
            objectFit: "cover",
          }}
        />
        <div className="px-8 py-8 flex flex-col gap-8">
          <div>
            <Typography variant="h6" color="white">
              Jardim Esplanada
            </Typography>
            <Typography variant="h5" color="white">
              Testemunho Público
            </Typography>
          </div>
          <Typography variant="h5" color="white" className="capitalize">
            {dayjs().format("dddd")}
            {", "}
            {dayjs().format("D")}
            {" de "}
            {dayjs().format("MMMM")}
          </Typography>
          <Link href="/reservar">
            <Button variant="contained" size="large">
              fazer reserva
            </Button>
          </Link>
        </div>
      </div>

      <Box sx={{ paddingX: 4 }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          Próximas Reservas
        </Typography>
        <Stack spacing={2}>
          {loading ? (
            <Skeleton height={100} width={"100%"} count={5} />
          ) : (
            dates.map((date) => (
              <Box key={date}>
                <Typography variant="h6">
                  {dayjs(new Date(date)).format("D")}
                  {" de "}
                  {dayjs(new Date(date)).format("MMMM")}
                  {", "}
                  {dayjs(new Date(date)).format("dddd")}
                </Typography>
                {bookingsByDate[date].map((booking) => (
                  <Booking {...booking} key={booking.date.toISOString()} />
                ))}
              </Box>
            ))
          )}
        </Stack>
      </Box>
    </>
  );
}
