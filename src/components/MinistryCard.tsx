import { Card, Stack, Typography } from "@mui/material";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import type { Dayjs } from "dayjs";
import GrowWrapper from "./Grow";

interface Props {
  date: Dayjs;
  index: number;
  meetingPoint: 0 | 1 | 2;
  time: string;
}

export default function MinistryCard({
  date,
  index,
  meetingPoint,
  time,
}: Props) {
  return (
    <GrowWrapper grow index={index}>
      <Card
        className="flex flex-col py-2 px-4 rounded-md w-full"
        sx={{
          bgcolor: "primary.main",
          borderLeft: "6px solid",
          borderLeftColor: "success.main",
          color: "primary.contrastText",
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <VolunteerActivismOutlinedIcon fontSize="small" />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, textTransform: "capitalize" }}
          >
            {date.format("D [de] MMMM, dddd")} {time}
          </Typography>
        </Stack>
        <Typography variant="body1">Ministério de campo</Typography>
        <Typography variant="body2">
          Ponto de encontro:{" "}
          {meetingPoint === 1
            ? "Congregação"
            : meetingPoint === 2
              ? "Grupos"
              : "Território"}
        </Typography>
      </Card>
    </GrowWrapper>
  );
}
