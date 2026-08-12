import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Fab,
  Stack,
  Typography,
} from "@mui/material";
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

import RichBooking from "@/components/RichBooking";
import SimpleBooking from "@/components/SimpleBooking";
import MeetingCard from "@/components/MeetingCard";
import MinistryCard from "@/components/MinistryCard";
import { Context } from "@/context";
import { useBookings } from "@/firebase/bookings/controller";
import type { Booking as BookingData } from "@/firebase/bookings/types";
import { capitalizeName } from "@/utils/text";

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

const timeToMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getGreeting = (hour: number) => {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
};

export const Route = createFileRoute("/_bottomNav/inicio")({
  component: InicioPage,
});

function BookingList({
  bookings,
  actionLabel,
  emptyMessage,
  onAction,
  variant,
}: {
  bookings: BookingData[];
  actionLabel?: (booking: BookingData) => string;
  emptyMessage: string;
  onAction?: (booking: BookingData) => void;
  variant: "rich" | "simple";
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

  if (variant === "rich") {
    return bookings.map((booking, index) => (
      <RichBooking
        actionLabel={actionLabel?.(booking)}
        booking={booking}
        index={index}
        inlineDeleteAction
        key={booking.id}
        onAction={onAction}
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
        <SimpleBooking booking={booking} index={index} key={booking.id} />
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
  const announcement = congregation?.announcement;
  const today = now.format("YYYY-MM-DD");
  const activeAnnouncement =
    announcement &&
    announcement.startDate <= today &&
    announcement.endDate >= today
      ? announcement
      : null;

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        !booking.date.isBefore(now.startOf("day")) &&
        booking.owner !== phoneNumber,
    )
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const myBookings = bookings.filter(
    (booking) => booking.owner === phoneNumber,
  );
  const todaysBookings = myBookings
    .filter((booking) => booking.date.isSame(now, "day"))
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const myUpcomingBookings = myBookings
    .filter(
      (booking) =>
        !booking.date.isSame(now, "day") &&
        booking.date.add(2, "hour").isAfter(now),
    )
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const lastPastBooking = myBookings
    .filter(
      (booking) =>
        !booking.date.isSame(now, "day") &&
        !booking.date.add(2, "hour").isAfter(now),
    )
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())[0];
  const meetingIndex = congregation?.meetingsWeekDays?.indexOf(now.day()) ?? -1;
  const todaysMeetingTime =
    meetingIndex >= 0 ? congregation?.meetingsTimes?.[meetingIndex] : undefined;
  const todaysMeetingName =
    meetingIndex === 0
      ? "Reunião de meio de semana"
      : meetingIndex === 1
        ? "Reunião de final de semana"
        : "Reunião da congregação";
  const todaysMinistryArrangements = (
    congregation?.ministryWeekDays ?? []
  ).flatMap((weekDay, index) => {
    const time = congregation?.ministryTimes?.[index];

    if (weekDay !== now.day() || !time) return [];

    return [
      {
        meetingPoint: congregation?.ministryMeetingPoints?.[index] ?? 0,
        time,
      },
    ];
  });
  const todaysSchedule = [
    ...todaysBookings.map((booking) => ({
      booking,
      kind: "booking" as const,
      minutes: booking.date.hour() * 60 + booking.date.minute(),
    })),
    ...(todaysMeetingTime
      ? [
          {
            kind: "meeting" as const,
            meetingName: todaysMeetingName,
            minutes: timeToMinutes(todaysMeetingTime),
            time: todaysMeetingTime,
          },
        ]
      : []),
    ...todaysMinistryArrangements.map(({ meetingPoint, time }) => ({
      kind: "ministry" as const,
      meetingPoint,
      minutes: timeToMinutes(time),
      time,
    })),
  ].sort((left, right) => left.minutes - right.minutes);
  const hasPlansToday = todaysSchedule.length > 0;

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
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              {displayName
                ? `${getGreeting(now.hour())}, ${capitalizeName(
                    displayName.split(" ")[0],
                  )}`
                : getGreeting(now.hour())}
            </Typography>
            {activeAnnouncement ? (
              <Alert
                severity="info"
                sx={{ mb: 2, whiteSpace: "pre-line" }}
              >
                <AlertTitle>{activeAnnouncement.title}</AlertTitle>
                {activeAnnouncement.message}
              </Alert>
            ) : null}
            {loading ? (
              <Skeleton height={100} width="100%" count={3} />
            ) : (
              <Stack spacing={2}>
                {hasPlansToday ? (
                  <>
                    {todaysSchedule.map((item, index) => {
                      if (item.kind === "booking") {
                        const hasEnded = !item.booking.date
                          .add(2, "hour")
                          .isAfter(now);

                        return (
                          <RichBooking
                            actionLabel={
                              hasEnded
                                ? item.booking.returned
                                  ? "Devolvido (alterar)"
                                  : `Devolver ${item.booking.device.split(" ")[0]}`
                                : "Cancelar"
                            }
                            booking={item.booking}
                            index={index}
                            inlineDeleteAction={!hasEnded}
                            key={item.booking.id}
                            onAction={(selectedBooking) =>
                              hasEnded
                                ? void returnBooking(selectedBooking)
                                : void cancelBooking(selectedBooking)
                            }
                            showReturnedChip
                          />
                        );
                      }

                      if (item.kind === "meeting") {
                        return (
                          <MeetingCard
                            date={now}
                            index={index}
                            key={`meeting-${item.time}`}
                            meetingName={item.meetingName}
                            time={item.time}
                          />
                        );
                      }

                      return (
                        <MinistryCard
                          date={now}
                          index={index}
                          key={`ministry-${item.time}-${item.meetingPoint}-${index}`}
                          meetingPoint={item.meetingPoint}
                          time={item.time}
                        />
                      );
                    })}
                  </>
                ) : (
                  <Typography
                    variant="overline"
                    color="gray"
                    textAlign="center"
                  >
                    Nenhuma atividade para hoje
                  </Typography>
                )}
                {lastPastBooking && (
                  <>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6">Última reserva</Typography>
                      <Chip
                        color={lastPastBooking.returned ? "success" : "error"}
                        label={
                          lastPastBooking.returned
                            ? "Devolvido"
                            : "Não devolvido"
                        }
                        size="small"
                      />
                    </Stack>
                    <RichBooking
                      actionLabel={
                        lastPastBooking.returned
                          ? "Devolvido (alterar)"
                          : `Devolver ${lastPastBooking.device.split(" ")[0]}`
                      }
                      booking={lastPastBooking}
                      hideTimingChips
                      index={0}
                      onAction={(booking) => void returnBooking(booking)}
                    />
                  </>
                )}
                <Typography variant="h6">Próximas reservas</Typography>
                <BookingList
                  bookings={myUpcomingBookings}
                  actionLabel={() => "Cancelar"}
                  emptyMessage="Nenhuma reserva futura"
                  onAction={(booking) => void cancelBooking(booking)}
                  variant="rich"
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
                variant="simple"
              />
            )}
          </section>
        </Stack>
      </Box>
    </>
  );
}
