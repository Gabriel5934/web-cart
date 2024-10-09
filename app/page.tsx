"use client";

import {
  Alert,
  Badge,
  Button,
  Chip,
  Grow,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  getDocs,
  collection,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";
import { db } from "./firebase";
import _ from "lodash";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import publicMinistry from "./assets/publicMinistry.jpg";
import Image from "next/image";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

interface BookingDoc {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
  initialTime: Timestamp;
  endTime: Timestamp;
}

interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Date;
  initialTime: Date;
  endTime: Date;
}

dayjs.locale("pt-br");
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(relativeTime);

export default function Page() {
  const searchParams = useSearchParams();

  const showSnackbar = Boolean(searchParams.get("success"));
  const anchorId = searchParams.get("id") ?? "";

  const anchorRef = useRef(null);

  const [snackbarOpen, setSnackbarOpen] = useState(showSnackbar);
  const [dates, setDates] = useState<Array<keyof _.Dictionary<Booking[]>>>([]);
  const [bookingsByDate, setBookingsByDate] = useState<_.Dictionary<Booking[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

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
        initialTime: data.initialTime.toDate(),
        endTime: data.endTime.toDate(),
      };

      bookings.push(formatted);
    });

    const dateFilteredBookings = _.orderBy(
      bookings
        .filter((booking) =>
          dayjs(booking.date).isSameOrAfter(dayjs().startOf("day"))
        )
        .map((booking) => ({
          ...booking,
          initialTime: setDateToToday(dayjs(booking.initialTime)).toDate(),
        })),
      "initialTime"
    );

    setBookingsByDate(_.groupBy(dateFilteredBookings, "date"));
    setDates(Object.keys(_.groupBy(dateFilteredBookings, "date")));

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (anchorRef.current) {
      const current = anchorRef.current as any;
      current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [dates]);

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

    const isPast =
      setDateToToday(dayjs(booking.endTime)).isBefore(dayjs()) &&
      dayjs(booking.date).isSame(dayjs(), "day");

    const isCurrent = dayjs().isBetween(booking.initialTime, booking.endTime);

    const isNext = dayjs().isBetween(
      dayjs(booking.initialTime),
      dayjs(booking.initialTime).subtract(2, "hours")
    );

    const showChip = isCurrent || isNext;

    const getChipLabel = () => {
      if (isCurrent) {
        return "Agora";
      } else if (isNext) {
        return dayjs
          .duration(setDateToToday(dayjs(booking.initialTime)).diff(dayjs()))
          .humanize(true);
      }
    };

    if (isAnchor) {
      return (
        <Grow in={true} timeout={3000}>
          <Badge badgeContent="Novo" color="success">
            <Paper
              sx={{
                bgcolor: "primary.main",
              }}
              className="flex flex-col p-4 rounded-md text-white w-full"
              id={booking.id}
              ref={anchorRef}
            >
              <Typography variant="body2">
                {booking.device} - {booking.place}
              </Typography>
              <div className="flex gap-4">
                <Typography variant="body1">
                  {booking.initialTime.toLocaleTimeString("pt-br").slice(0, 5)}
                  {" - "}
                  {booking.endTime.toLocaleTimeString("pt-br").slice(0, 5)}
                </Typography>
                <Typography variant="body1">
                  {booking.name} e {booking.partner}
                </Typography>
              </div>
            </Paper>
          </Badge>
        </Grow>
      );
    } else {
      return (
        <Paper
          sx={{
            bgcolor: "primary.main",
            filter: `brightness(${isPast ? 0.5 : 1})`,
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
              {booking.initialTime.toLocaleTimeString("pt-br").slice(0, 5)}
              {" - "}
              {booking.endTime.toLocaleTimeString("pt-br").slice(0, 5)}
            </Typography>
            <Typography variant="body1">
              {booking.name} e {booking.partner}
            </Typography>
          </div>
        </Paper>
      );
    }
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
                  <Booking {...booking} key={`${date}${booking.initialTime}`} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
