"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  Drawer,
  Grow,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  getDocs,
  collection,
  Timestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import Link from "next/link";
import { db } from "./firebase";
import _ from "lodash";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useSearchParams } from "next/navigation";
import { createRef, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import publicMinistry from "./assets/publicMinistry.jpg";
import Image from "next/image";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface BookingDoc {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
}

interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Date;
}

dayjs.locale("pt-br");
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const SAFE_DELETE_TEXT = "Esplanada";

export default function Page() {
  const searchParams = useSearchParams();

  const showSnackbar = Boolean(searchParams.get("success"));
  const anchorId = searchParams.get("id") ?? "";

  const anchorRef = createRef<HTMLDivElement>();

  const [snackbarOpen, setSnackbarOpen] = useState(showSnackbar);
  const [dates, setDates] = useState<Array<keyof _.Dictionary<Booking[]>>>([]);
  const [bookingsByDate, setBookingsByDate] = useState<_.Dictionary<Booking[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBooking, setDrawerBooking] = useState<Booking>();
  const [safeDeleteText, setSafeDeleteText] = useState("");

  const closeSnackbar = () => setSnackbarOpen(false);

  const fetchData = async () => {
    const q = query(collection(db, "bookings"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const bookings: Array<Booking> = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as BookingDoc;
      const formatted = {
        ...data,
        id: doc.id,
        date: data.date.toDate(),
      };

      bookings.push(formatted);
    });

    const dateFilteredBookings = _.orderBy(
      bookings.filter((booking) =>
        dayjs(booking.date).isSameOrAfter(dayjs().startOf("day"))
      ),
      "initialTime"
    );

    const grouped = _.groupBy(dateFilteredBookings, (booking) =>
      dayjs(booking.date).startOf("day")
    );

    setBookingsByDate(grouped);
    setDates(Object.keys(grouped));

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (anchorRef.current) {
      const current = anchorRef.current;
      current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [dates, anchorRef]);

  function setDateToToday(date: Dayjs) {
    const today = dayjs();

    const newDate = date
      .set("D", today.get("D"))
      .set("m", today.get("m"))
      .set("y", today.get("y"));

    return newDate;
  }

  const Booking = (booking: Booking) => {
    const isAnchor = anchorId === booking.id;

    const isPast = setDateToToday(dayjs(booking.date).add(2, "hour")).isBefore(
      dayjs()
    );

    const isCurrent = dayjs().isBetween(
      booking.date,
      dayjs(booking.date).add(2, "hour")
    );

    const isNext = dayjs().isBetween(
      dayjs(booking.date),
      dayjs(booking.date).subtract(2, "hours")
    );

    const showChip = isCurrent || isNext;

    const getChipLabel = () => {
      if (isCurrent) {
        return "Agora";
      } else if (isNext) {
        return dayjs
          .duration(setDateToToday(dayjs(booking.date)).diff(dayjs()))
          .humanize(true);
      }
    };

    const onClick = () => {
      setDrawerOpen(true);
      setDrawerBooking(booking);
    };

    if (isAnchor) {
      return (
        <Grow in={true} timeout={3000}>
          <IconButton onClick={onClick}>
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
                  {booking.date.toLocaleTimeString("pt-br").slice(0, 5)}
                  {" - "}
                  {dayjs(booking.date)
                    .add(2, "hour")
                    .toDate()
                    .toLocaleTimeString("pt-br")
                    .slice(0, 5)}
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
        <IconButton onClick={onClick}>
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
                {booking.date.toLocaleTimeString("pt-br").slice(0, 5)}
                {" - "}
                {dayjs(booking.date)
                  .add(2, "hour")
                  .toDate()
                  .toLocaleTimeString("pt-br")
                  .slice(0, 5)}
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
    fetchData();
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
        <div className="gap-10 flex flex-col">
          <div className="px-8 py-12 ">
            <div className="flex justify-between items-center capitalize">
              <Typography variant="h6">
                {drawerBooking?.device} - {drawerBooking?.place}
              </Typography>
            </div>
            <div className="flex gap-4">
              <Typography variant="h5">
                {drawerBooking?.date.toLocaleTimeString("pt-br").slice(0, 5)}
                {" - "}
                {dayjs(drawerBooking?.date)
                  .add(2, "hour")
                  .toDate()
                  .toLocaleTimeString("pt-br")
                  .slice(0, 5)}
              </Typography>
              <Typography variant="h5">
                {drawerBooking?.name} e {drawerBooking?.partner}
              </Typography>
            </div>
          </div>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography className="mt-2" variant="h6">
                Zona de Perigo
              </Typography>
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
        </div>
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
      <div className="flex flex-col px-8 gap-4 items-center">
        <div className="flex justify-between w-full items-center flex-col mb-8 gap-2">
          <Typography variant="h4" className="w-full text-left">
            Próximas Reservas
          </Typography>
          {loading ? (
            <div className="w-full">
              <Skeleton height={100} width={"100%"} count={5} />
            </div>
          ) : (
            dates.map((date) => (
              <div className="flex w-full text-left flex-col gap-1" key={date}>
                <Typography variant="h6">
                  {dayjs(new Date(date)).format("D")}
                  {" de "}
                  {dayjs(new Date(date)).format("MMMM")}
                  {", "}
                  {dayjs(new Date(date)).format("dddd")}
                </Typography>
                {bookingsByDate[date].map((booking) => (
                  <Booking {...booking} key={booking.date.toDateString()} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
