import {
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import dayjs from "dayjs";
import type { Booking as BookingData } from "@/firebase/bookings/types";
import { capitalizeName } from "@/utils/text";
import GrowWrapper from "./Grow";

interface Props {
  actionLabel?: string;
  booking: BookingData;
  index: number;
  hideTimingChips?: boolean;
  inlineDeleteAction?: boolean;
  onAction?: (booking: BookingData) => void;
  showReturnedChip?: boolean;
}

export default function RichBooking({
  actionLabel,
  booking,
  index,
  hideTimingChips = false,
  inlineDeleteAction = false,
  onAction,
  showReturnedChip = false,
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
  const statusLabel = isCurrent
    ? "Agora"
    : dayjs.duration(booking.date.diff(dayjs())).humanize(true);

  return (
    <GrowWrapper grow index={index}>
      <Stack className="w-full" gap={1} sx={{ mb: 2 }}>
        <Card
          id={booking.id}
          className="flex flex-col py-2 px-4 rounded-md w-full"
          sx={{
            bgcolor: "primary.main",
            borderLeft: "6px solid",
            borderLeftColor: "warning.main",
            color: "primary.contrastText",
            filter: `brightness(${isPast ? 0.5 : 1})`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ textTransform: "capitalize" }}
          >
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {booking.date.format("D [de] MMMM, dddd")}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {booking.date.format("HH:mm")}
              </Typography>
              {showReturnedChip ? (
                <Chip
                  color={booking.returned ? "success" : "error"}
                  label={booking.returned ? "Devolvido" : "Não devolvido"}
                  size="small"
                />
              ) : !hideTimingChips && booking.date.isSame(dayjs(), "day") ? (
                <Chip color="warning" label="Hoje" size="small" />
              ) : null}
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.5}>
              {!hideTimingChips && (isCurrent || isNext) ? (
                <Chip label={statusLabel} color="warning" size="small" />
              ) : null}
              {inlineDeleteAction && actionLabel && onAction ? (
                <Tooltip title={actionLabel}>
                  <IconButton
                    aria-label={actionLabel}
                    color="error"
                    size="small"
                    onClick={() => onAction(booking)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          </Stack>

          <Typography variant="body2">
            {booking.device} - {booking.place}
          </Typography>
          <Typography variant="body1">
            Você e {capitalizeName(booking.partner)}
          </Typography>
        </Card>

        {actionLabel && onAction && !inlineDeleteAction ? (
          <Button
            color={isPast ? "primary" : "error"}
            variant={booking.returned ? "outlined" : "contained"}
            size="small"
            onClick={() => onAction(booking)}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </GrowWrapper>
  );
}
