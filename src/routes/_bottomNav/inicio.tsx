import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Button, Chip, Fab, Stack, Typography } from "@mui/material";
import { WhatsApp } from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import { useContext } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast from "react-hot-toast";

import Booking from "@/components/Booking";
import { Context } from "@/context";
import { useBookings } from "@/firebase/bookings/controller";
import type { Booking as BookingData } from "@/firebase/bookings/types";

dayjs.locale("pt-br");
dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const kebabToTitleCase = (value: string) =>
  value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const Route = createFileRoute("/_bottomNav/inicio")({
  component: InicioPage,
});

function BookingList({
  bookings,
  actionLabel,
  emptyMessage,
  onAction,
  showDateInsideCard = false,
}: {
  bookings: BookingData[];
  actionLabel?: (booking: BookingData) => string;
  emptyMessage: string;
  onAction?: (booking: BookingData) => void;
  showDateInsideCard?: boolean;
}) {
  if (bookings.length === 0) {
    return (
      <Stack alignItems="center">
        <Typography variant="overline" color="gray">
          {emptyMessage}
        </Typography>
      </Stack>
    );
  }

  if (showDateInsideCard) {
    return bookings.map((booking, index) => (
      <Booking
        actionLabel={actionLabel?.(booking)}
        booking={booking}
        index={index}
        key={booking.id}
        onAction={onAction}
        showDate
      />
    ));
  }

  const grouped = bookings.reduce<Record<string, BookingData[]>>(
    (dates, booking) => {
      const date = booking.date.format("YYYY-MM-DD");
      dates[date] = [...(dates[date] ?? []), booking];
      return dates;
    },
    {},
  );

  return Object.entries(grouped).map(([date, dateBookings], index) => (
    <Box key={date}>
      <Typography variant="h6">
        {dateBookings?.[0]?.date.isSame(dayjs(), "day") && (
          <Chip color="warning" label="Hoje" sx={{ mr: 1, mb: 1 }} />
        )}
        {dayjs(date).format("D [de] MMMM, dddd")}
      </Typography>
      {dateBookings?.map((booking) => (
        <Booking
          actionLabel={actionLabel?.(booking)}
          booking={booking}
          index={index}
          key={booking.id}
          onAction={onAction}
        />
      ))}
    </Box>
  ));
}

function InicioPage() {
  const { bookings, loading, refresh, deleteData, toggleReturned } =
    useBookings(false, true);
  const context = useContext(Context);
  const congregation = context.congregation.data;
  const displayName = context.phoneBook.entry?.displayName;
  const phoneNumber = context.auth.user?.phoneNumber;
  const now = dayjs();

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        booking.date.add(2, "hour").isAfter(now) &&
        booking.owner !== phoneNumber,
    )
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const myBookings = bookings.filter(
    (booking) => booking.owner === phoneNumber,
  );
  const myUpcomingBookings = myBookings
    .filter((booking) => booking.date.add(2, "hour").isAfter(now))
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const lastPastBooking = myBookings
    .filter((booking) => !booking.date.add(2, "hour").isAfter(now))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())[0];

  const cancelBooking = async (booking: BookingData) => {
    const confirmed = window.confirm(
      `Tem certeza de que deseja cancelar a reserva de ${booking.device} em ${booking.date.format("DD/MM/YYYY [às] HH:mm")}?`,
    );

    if (!confirmed) return;

    try {
      await deleteData(booking.id);
      await refresh();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Não foi possível cancelar a reserva. Tente novamente.");
    }
  };

  const returnBooking = async (booking: BookingData) => {
    try {
      await toggleReturned(booking.id);
      await refresh();
    } catch (error) {
      console.error("Error returning booking:", error);
      toast.error("Não foi possível atualizar a devolução. Tente novamente.");
    }
  };

  return (
    <>
      <a
        href={`https://wa.me/${congregation?.whatsapp ?? ""}`}
        target="_blank"
        rel="noopener"
      >
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

      <div className="inline-block overflow-hidden relative w-full">
        <img
          className="pointer-events-none absolute w-full -z-10"
          src={congregation?.backgroundImage}
          alt="Testemunho público"
          style={{
            filter: "brightness(33%)",
            height: "215px",
            objectFit: "cover",
          }}
        />
        <div className="px-8 py-8 flex flex-col gap-4">
          <Typography variant="h6" color="white">
            {kebabToTitleCase(
              context.phoneBook.entry?.congregation ?? congregation?.id ?? "",
            )}
          </Typography>
          <Typography variant="h5" color="white" className="capitalize">
            {dayjs().format("dddd, D [de] MMMM")}
          </Typography>
          <Link to="/reservar">
            <Button variant="contained" size="large">
              fazer reserva
            </Button>
          </Link>
        </div>
      </div>

      <Box sx={{ paddingX: 4, paddingTop: 2 }}>
        <Stack spacing={3}>
          <section>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
              {displayName
                ? `Reservas de ${displayName?.split(" ")[0]}`
                : "Suas reservas"}
            </Typography>
            {loading ? (
              <Skeleton height={100} width="100%" count={3} />
            ) : (
              <Stack spacing={2}>
                {lastPastBooking && (
                  <>
                    <Typography variant="h6">Última reserva</Typography>
                    <Booking
                      actionLabel={
                        lastPastBooking.returned
                          ? "Devolvido (alterar)"
                          : `Devolver ${lastPastBooking.device.split(" ")[0]}`
                      }
                      booking={lastPastBooking}
                      index={0}
                      onAction={(booking) => void returnBooking(booking)}
                      showDate
                    />
                  </>
                )}
                <Typography variant="h6">Próximas reservas</Typography>
                <BookingList
                  bookings={myUpcomingBookings}
                  actionLabel={() => "Cancelar"}
                  emptyMessage="Nenhuma reserva futura"
                  onAction={(booking) => void cancelBooking(booking)}
                  showDateInsideCard
                />
              </Stack>
            )}
          </section>

          <section>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
              Outras Reservas
            </Typography>
            {loading ? (
              <Skeleton height={100} width="100%" count={5} />
            ) : (
              <BookingList
                bookings={upcomingBookings}
                emptyMessage="Nenhuma reserva encontrada"
              />
            )}
          </section>
        </Stack>
      </Box>
    </>
  );
}
