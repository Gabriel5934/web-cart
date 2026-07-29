import { Button, Card, Chip, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { Booking as BookingData } from "@/firebase/bookings/types";
import GrowWrapper from "./Grow";

interface Props {
  actionLabel?: string;
  booking: BookingData;
  index: number;
  onAction?: (booking: BookingData) => void;
  showDate?: boolean;
}

export default function Booking({
  actionLabel,
  booking,
  index,
  onAction,
  showDate = false,
}: Props) {
  const isPast = booking.date.add(2, "hour").isBefore(dayjs());
  const isCurrent = dayjs().isBetween(
    booking.date,
    booking.date.add(2, "hour"),
  );
  const isNext = dayjs().isBetween(
    booking.date.subtract(2, "hours"),
    booking.date,
  );
  const showChip = isCurrent || isNext;

  const chipLabel = isCurrent
    ? "Agora"
    : dayjs.duration(booking.date.diff(dayjs())).humanize(true);

  return (
    <GrowWrapper grow index={index}>
      <Stack className="w-full" gap={1} sx={{ marginBottom: 2 }}>
        <Card
          sx={{
            bgcolor: "primary.main",
            filter: `brightness(${isPast ? 0.5 : 1})`,
            color: "primary.contrastText",
          }}
          className="flex flex-col p-4 rounded-md w-full"
          id={booking.id}
        >
          <div
            className="flex justify-between items-center"
            style={{
              marginBottom: showChip ? 8 : 0,
              textTransform: "capitalize",
            }}
          >
            <div>
              {showDate && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {booking.date.format("D [de] MMMM, dddd")}
                  </Typography>
                  {booking.date.isSame(dayjs(), "day") && (
                    <Chip color="warning" label="Hoje" size="small" />
                  )}
                </Stack>
              )}
              <Typography variant="body2">
                {booking.device} - {booking.place}
              </Typography>
            </div>
            {showChip && (
              <Chip label={chipLabel} color="warning" size="small" />
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
        </Card>
        {actionLabel && onAction && (
          <Button
            color={isPast ? "primary" : "error"}
            variant={booking.returned ? "outlined" : "contained"}
            size="small"
            onClick={() => onAction(booking)}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </GrowWrapper>
  );
}
