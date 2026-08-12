import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import toast from "react-hot-toast";
import { Context } from "@/context";
import { updateCongregationSchedule } from "@/firebase/congregation/controller";

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const MEETING_POINTS = ["Território", "Congregação", "Grupos"] as const;
type MeetingPoint = 0 | 1 | 2;
type ScheduleRow = { weekDay: number; time: string };
type MinistryRow = ScheduleRow & { meetingPoint: MeetingPoint };

function getMeetingRows(
  weekDays: number[] = [],
  times: string[] = [],
): ScheduleRow[] {
  return [0, 1].map((index) => ({
    weekDay: weekDays[index] ?? (index === 0 ? 3 : 0),
    time: times[index] ?? "",
  }));
}

function getMinistryRows(
  weekDays: number[] = [],
  times: string[] = [],
  meetingPoints: MeetingPoint[] = [],
): MinistryRow[] {
  return weekDays.map((weekDay, index) => ({
    weekDay,
    time: times[index] ?? "",
    meetingPoint: meetingPoints[index] ?? 0,
  }));
}

export default function CongregationScheduleForm() {
  const { congregation } = useContext(Context);
  const data = congregation.data;
  const [meetings, setMeetings] = useState<ScheduleRow[]>([]);
  const [ministry, setMinistry] = useState<MinistryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setMeetings(getMeetingRows(data.meetingsWeekDays, data.meetingsTimes));
    setMinistry(
      getMinistryRows(
        data.ministryWeekDays,
        data.ministryTimes,
        data.ministryMeetingPoints,
      ),
    );
  }, [data]);

  const save = async () => {
    if (!data) return;
    if ([...meetings, ...ministry].some(({ time }) => !time)) {
      setError("Preencha o horário de todas as programações.");
      return;
    }

    const schedule = {
      meetingsWeekDays: meetings.map(({ weekDay }) => weekDay),
      meetingsTimes: meetings.map(({ time }) => time),
      ministryWeekDays: ministry.map(({ weekDay }) => weekDay),
      ministryTimes: ministry.map(({ time }) => time),
      ministryMeetingPoints: ministry.map(({ meetingPoint }) => meetingPoint),
    };

    setError(null);
    setSaving(true);
    try {
      await updateCongregationSchedule(data.id, schedule);
      congregation.setData({ ...data, ...schedule });
      toast.success("Programação atualizada.");
    } catch (saveError) {
      console.error("Error updating congregation schedule:", saveError);
      setError("Não foi possível salvar a programação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, md: 4 }, "&:last-child": { pb: { xs: 2, md: 4 } } }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h2" variant="h5" fontWeight={700}>
              Programação da congregação
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Defina os dias, horários e pontos de encontro exibidos na página inicial.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
              Reuniões
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
              }}
            >
              {meetings.map((meeting, index) => (
                <Stack
                  key={index}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                >
                  <TextField
                    fullWidth
                    label={index === 0 ? "Reunião de meio de semana" : "Reunião de final de semana"}
                    select
                    value={meeting.weekDay}
                    onChange={(event) =>
                      setMeetings((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, weekDay: Number(event.target.value) }
                            : row,
                        ),
                      )
                    }
                  >
                    {WEEKDAYS.map((label, value) => (
                      <MenuItem key={label} value={value}>{label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    label="Horário"
                    type="time"
                    value={meeting.time}
                    onChange={(event) =>
                      setMeetings((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, time: event.target.value } : row,
                        ),
                      )
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
              ))}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography component="h3" variant="h6">Ministério de campo</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  setMinistry((current) => [
                    ...current,
                    { weekDay: 6, time: "09:00", meetingPoint: 0 },
                  ])
                }
              >
                Adicionar
              </Button>
            </Stack>
            <Stack spacing={2}>
              {ministry.length === 0 && (
                <Typography color="text.secondary" variant="body2">
                  Nenhuma saída de campo cadastrada.
                </Typography>
              )}
              {ministry.map((arrangement, index) => (
                <Stack
                  key={index}
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={2}
                >
                  <TextField
                    fullWidth
                    label="Dia da semana"
                    select
                    value={arrangement.weekDay}
                    onChange={(event) =>
                      setMinistry((current) => current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, weekDay: Number(event.target.value) } : row,
                      ))
                    }
                  >
                    {WEEKDAYS.map((label, value) => (
                      <MenuItem key={label} value={value}>{label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    label="Horário"
                    type="time"
                    value={arrangement.time}
                    onChange={(event) =>
                      setMinistry((current) => current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, time: event.target.value } : row,
                      ))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    label="Ponto de encontro"
                    select
                    value={arrangement.meetingPoint}
                    onChange={(event) =>
                      setMinistry((current) => current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, meetingPoint: Number(event.target.value) as MeetingPoint }
                          : row,
                      ))
                    }
                  >
                    {MEETING_POINTS.map((label, value) => (
                      <MenuItem key={label} value={value}>{label}</MenuItem>
                    ))}
                  </TextField>
                  <IconButton
                    aria-label="Remover saída de campo"
                    color="error"
                    onClick={() => setMinistry((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={saving || !data}
            onClick={() => void save()}
            sx={{ alignSelf: "flex-end" }}
          >
            {saving ? "Salvando…" : "Salvar programação"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
