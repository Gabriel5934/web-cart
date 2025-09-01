"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  Drawer,
  Fab,
  Fade,
  Modal,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useSearchParams } from "next/navigation";
import { createRef, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import Image from "next/image";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import isToday from "dayjs/plugin/isToday";
import relativeTime from "dayjs/plugin/relativeTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useBookings } from "../../firebase/bookings/controller";
import { History, WhatsApp } from "@mui/icons-material";
import Booking from "../../components/Booking";
import { getConstants } from "../../consts";

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
dayjs.extend(isToday);

export default function Page() {
  const searchParams = useSearchParams();
  const {
    dates,
    bookingsByDate,
    loading,
    refresh,
    deleteData,
    toggleReturned,
  } = useBookings(false, true);
  const showSnackbar = Boolean(searchParams.get("success"));
  const anchorRef = createRef<HTMLDivElement>();
  const { SAFE_DELETE_TEXT, CONGREGATION, BACKGROUND_IMAGE, WHATSAPP } =
    getConstants();

  const [snackbarOpen, setSnackbarOpen] = useState(showSnackbar);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [drawerBooking, setDrawerBooking] = useState<Booking>();
  const [safeDeleteText, setSafeDeleteText] = useState("");
  const [historyShown, setHistoryShown] = useState(false);

  const closeSnackbar = () => setSnackbarOpen(false);

  const refreshWithHistory = () => refresh(historyShown ? 30 : 0);

  const toggleHistory = () => {
    setHistoryShown(!historyShown);
    refresh(historyShown ? 0 : 30);
  };

  const deleteBooking = async (id: string) => {
    await deleteData(id);

    setDrawerOpen(false);
    refreshWithHistory();
  };

  const toggleReturn = async (id: string) => {
    if (!drawerBooking) return;

    await toggleReturned(id);

    setReturnModal(false);
    refreshWithHistory();
  };

  useEffect(() => {
    if (anchorRef.current) {
      const current = anchorRef.current;
      current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [anchorRef]);

  return (
    <>
      <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener">
        <Fab
          variant="extended"
          sx={{
            position: "fixed",
            bottom: 88,
            right: 16,
          }}
          color="success"
        >
          Dúvidas
          <WhatsApp sx={{ ml: 1 }} />
        </Fab>
      </a>

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
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Zona de Perigo</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div className="flex flex-col gap-2">
              <Typography className="mb-2">
                {`Digite "${SAFE_DELETE_TEXT}" para deletar essa reserva`}
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
          src={BACKGROUND_IMAGE}
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
              {CONGREGATION}
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
        <Stack sx={{ marginBottom: 2 }} gap={1}>
          <Typography variant="h4">Próximas Reservas</Typography>
          <div>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={toggleHistory}
            >
              ver {historyShown ? "menos" : "mais"}
            </Button>
          </div>
        </Stack>

        <Stack spacing={2}>
          {loading ? (
            <Skeleton height={100} width={"100%"} count={5} />
          ) : (
            dates.map((date, index) => (
              <Box key={date}>
                <Typography variant="h6">
                  {dayjs(new Date(date)).isToday() && (
                    <Chip color="warning" label="Hoje" sx={{ mr: 1, mb: 1 }} />
                  )}
                  {dayjs(new Date(date)).format("D")}
                  {" de "}
                  {dayjs(new Date(date)).format("MMMM")}
                  {", "}
                  {dayjs(new Date(date)).format("dddd")}
                </Typography>
                {bookingsByDate[date].map((booking) => (
                  <Booking
                    booking={booking}
                    setDrawerBooking={setDrawerBooking}
                    setDrawerOpen={setDrawerOpen}
                    setReturnModal={setReturnModal}
                    key={booking.date.toISOString()}
                    anchorRef={anchorRef}
                    index={index}
                  />
                ))}
              </Box>
            ))
          )}
        </Stack>
      </Box>

      <Modal
        open={returnModal}
        onClose={() => setReturnModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={returnModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h6" component="h2">
                Devolver {drawerBooking?.device}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                Clique nesse botão apenas se você{" "}
                {drawerBooking?.returned && "não"} <strong>devolveu</strong> o
                carrinho no salão
              </Typography>
              <Box sx={{ textAlign: "right" }}>
                <Button
                  variant="contained"
                  onClick={() => toggleReturn(drawerBooking?.id ?? "")}
                >
                  {drawerBooking?.returned && "não"} devolvi
                </Button>
              </Box>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
