import {
  Typography,
  Stack,
  Card,
  CardActionArea,
  Chip,
  Button,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { RefObject } from "react";
import GrowWrapper from "./Grow";

interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs;
  returned: boolean;
}

interface Props {
  booking: Booking;
  setDrawerOpen: (open: boolean) => void;
  setDrawerBooking: (booking: Booking) => void;
  setReturnModal: (open: boolean) => void;
  anchorRef: RefObject<HTMLDivElement | null>;
  index: number;
}

export default function Booking(props: Props) {
  const isPast = props.booking.date.add(2, "hour").isBefore(dayjs());

  const isCurrent = dayjs().isBetween(
    props.booking.date,
    props.booking.date.add(2, "hour")
  );

  const isNext = dayjs().isBetween(
    props.booking.date,
    props.booking.date.subtract(2, "hours")
  );

  const showChip = isCurrent || isNext;

  const getChipLabel = () => {
    if (isCurrent) {
      return "Agora";
    } else if (isNext) {
      return dayjs.duration(props.booking.date.diff(dayjs())).humanize(true);
    }
  };

  const onClick = () => {
    props.setDrawerOpen(true);
    props.setDrawerBooking(props.booking);
  };

  return (
    <GrowWrapper grow={true} index={props.index}>
      <Stack className="w-full" gap={1} sx={{ marginBottom: 2 }}>
        <Card
          sx={{
            bgcolor: "primary.main",
            filter: `brightness(${isPast ? 0.5 : 1})`,
            color: "white",
          }}
          className="flex flex-col p-4 rounded-md text-white w-full"
          id={props.booking.id}
          ref={props.anchorRef}
        >
          <CardActionArea onClick={onClick}>
            <div
              className="flex justify-between items-center"
              style={{
                marginBottom: showChip ? 8 : 0,
                textTransform: "capitalize",
              }}
            >
              <Typography variant="body2">
                {props.booking.device} - {props.booking.place}
              </Typography>
              {showChip && (
                <Chip label={getChipLabel()} color="warning" size="small" />
              )}
            </div>
            <div className="flex gap-4">
              <Typography variant="body1">
                {props.booking.date.format("HH:mm")}
                {" - "}
                {props.booking.date.add(2, "hour").format("HH:mm")}
              </Typography>
              <Typography variant="body1">
                {props.booking.name} e {props.booking.partner}
              </Typography>
            </div>
          </CardActionArea>
        </Card>
        {isPast && (
          <Button
            variant={props.booking.returned ? "outlined" : "contained"}
            size="small"
            onClick={() => {
              props.setReturnModal(true);
              props.setDrawerBooking(props.booking);
            }}
          >
            {props.booking.returned
              ? `Devolvido (Alterar)`
              : `Devolver ${props.booking.device.split(" ")[0]}`}
          </Button>
        )}
      </Stack>
    </GrowWrapper>
  );
}
