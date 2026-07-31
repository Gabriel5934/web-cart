import { Card, Chip, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { Booking as BookingData } from "@/firebase/bookings/types";
import { capitalizeName } from "@/utils/text";
import GrowWrapper from "./Grow";

interface Props {
  booking: BookingData;
  index: number;
}

export default function SimpleBooking({ booking, index }: Props) {
  const isPast = booking.date.add(2, "hour").isBefore(dayjs());
  const isCurrent = dayjs().isBetween(
    booking.date,
    booking.date.add(2, "hour"),
  );
  const isNext = dayjs().isBetween(
    booking.date.subtract(2, "hours"),
    booking.date,
  );
  const statusLabel = isCurrent
    ? "Agora"
    : dayjs.duration(booking.date.diff(dayjs())).humanize(true);

  return (
    <GrowWrapper grow index={index}>
      <Card
        id={booking.id}
        className="flex flex-col p-4 rounded-md w-full"
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          filter: `brightness(${isPast ? 0.5 : 1})`,
          mb: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          sx={{ mb: isCurrent || isNext ? 1 : 0 }}
        >
          <Typography variant="body2">
            {booking.device} - {booking.place}
          </Typography>
          {isCurrent || isNext ? (
            <Chip label={statusLabel} color="warning" size="small" />
          ) : null}
        </Stack>
        <Stack direction="row" gap={2}>
          <Typography variant="body1">
            {booking.date.format("HH:mm")}
          </Typography>
          <Typography variant="body1">
            {capitalizeName(booking.name)} e {capitalizeName(booking.partner)}
          </Typography>
        </Stack>
      </Card>
    </GrowWrapper>
  );
}
