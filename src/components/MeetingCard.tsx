import { Card, Stack, Typography } from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import type { Dayjs } from "dayjs";
import GrowWrapper from "./Grow";

interface Props {
  date: Dayjs;
  index: number;
  meetingName: string;
  time: string;
}

export default function MeetingCard({ date, index, meetingName, time }: Props) {
  return (
    <GrowWrapper grow index={index}>
      <Card
        className="flex flex-col py-2 px-4 rounded-md w-full"
        sx={{
          bgcolor: "primary.main",
          borderLeft: "6px solid",
          borderLeftColor: "secondary.main",
          color: "primary.contrastText",
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <GroupsOutlinedIcon fontSize="small" />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, textTransform: "capitalize" }}
          >
            {date.format("D [de] MMMM, dddd")} {time}
          </Typography>
        </Stack>
        <Typography variant="body1">{meetingName}</Typography>
      </Card>
    </GrowWrapper>
  );
}
