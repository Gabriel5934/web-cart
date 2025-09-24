"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Backdrop,
  Box,
  Button,
  Chip,
  Drawer,
  Fab,
  Fade,
  FormControlLabel,
  Modal,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { createRef, useContext, useEffect, useState } from "react";
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
import { Context } from "@/app/context";

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

interface RefreshOptions {
  backwardsRange: number;
  user: string | undefined;
}

export default function Page() {
  const {
    dates,
    bookingsByDate,
    loading,
    refresh,
    deleteData,
    toggleReturned,
  } = useBookings(false, true);
  const anchorRef = createRef<HTMLDivElement>();
  const { SAFE_DELETE_TEXT, CONGREGATION, BACKGROUND_IMAGE, WHATSAPP, AUTH } =
    getConstants();
  const context = useContext(Context);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [drawerBooking, setDrawerBooking] = useState<Booking>();
  const [safeDeleteText, setSafeDeleteText] = useState("");
  const [options, setOptions] = useState<RefreshOptions>({
    backwardsRange: 0,
    user: undefined,
  });

  const refreshWithOptions = () => {
    refresh(options);
  };

  const toggleHistory = () => {
    const newOptions = {
      ...options,
      backwardsRange: options.backwardsRange === 30 ? 0 : 30,
    };

    setOptions(newOptions);
    refresh(newOptions);
  };

  const toggleOnlyMine = (value: boolean) => {
    const newOptions = {
      ...options,
      user: value ? context.auth.user?.user : undefined,
    };

    setOptions(newOptions);
    refresh(newOptions);
  };

  const deleteBooking = async (id: string) => {
    await deleteData(id);

    setDrawerOpen(false);
    refreshWithOptions();
  };

  const toggleReturn = async (id: string) => {
    if (!drawerBooking) return;

    await toggleReturned(id);

    setReturnModal(false);
    refreshWithOptions();
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
              ver {options.backwardsRange === 30 ? "menos" : "mais"}
            </Button>
          </div>
          {AUTH && (
            <div>
              <FormControlLabel
                control={
                  <Switch
                    onChange={(e) => toggleOnlyMine(e.target.checked)}
                    checked={options.user === context.auth.user?.user}
                  />
                }
                label="Somente minhas reservas"
              />
            </div>
          )}
        </Stack>

        <Stack spacing={2}>
          {loading && <Skeleton height={100} width={"100%"} count={5} />}
          {!loading &&
            dates.length > 0 &&
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
            ))}
          {dates.length === 0 && !loading && (
            <Stack alignItems="center">
              <Typography variant="overline" color="gray">
                Nenhuma reserva encontrada
              </Typography>
            </Stack>
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
