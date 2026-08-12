import { useContext, useEffect, useState } from "react";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { Context } from "@/context";
import { updateCongregationAnnouncement } from "@/firebase/congregation/controller";

export default function CongregationAnnouncementForm() {
  const { congregation } = useContext(Context);
  const data = congregation.data;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(data?.announcement?.title ?? "");
    setMessage(data?.announcement?.message ?? "");
    setStartDate(data?.announcement?.startDate ?? "");
    setEndDate(data?.announcement?.endDate ?? "");
  }, [data]);

  const save = async () => {
    if (!data) return;

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle || !trimmedMessage || !startDate || !endDate) {
      setError("Preencha o título, a mensagem e o período do anúncio.");
      return;
    }
    if (endDate < startDate) {
      setError("A data final deve ser igual ou posterior à data inicial.");
      return;
    }

    const announcement = {
      title: trimmedTitle,
      message: trimmedMessage,
      startDate,
      endDate,
    };
    setError(null);
    setSaving(true);
    try {
      await updateCongregationAnnouncement(data.id, announcement);
      congregation.setData({ ...data, announcement });
      setTitle(trimmedTitle);
      setMessage(trimmedMessage);
      toast.success("Anúncio atualizado.");
    } catch (saveError) {
      console.error("Error updating congregation announcement:", saveError);
      setError("Não foi possível salvar o anúncio. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!data?.announcement) return;

    setError(null);
    setSaving(true);
    try {
      await updateCongregationAnnouncement(data.id, null);
      const updatedData = { ...data };
      delete updatedData.announcement;
      congregation.setData(updatedData);
      setTitle("");
      setMessage("");
      setStartDate("");
      setEndDate("");
      toast.success("Anúncio removido.");
    } catch (removeError) {
      console.error("Error removing congregation announcement:", removeError);
      setError("Não foi possível remover o anúncio. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent
        sx={{
          p: { xs: 2, md: 4 },
          "&:last-child": { pb: { xs: 2, md: 4 } },
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <CampaignOutlinedIcon color="primary" />
              <Typography component="h2" variant="h5" fontWeight={700}>
                Anúncio
              </Typography>
            </Stack>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
              A mensagem aparece abaixo da saudação na página inicial durante
              todo o período selecionado.
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            fullWidth
            label="Título"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <TextField
            fullWidth
            label="Mensagem"
            multiline
            minRows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Data inicial"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Data final"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
          >
            {data?.announcement ? (
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                disabled={saving}
                onClick={() => void remove()}
              >
                Remover anúncio
              </Button>
            ) : null}
            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              disabled={saving || !data}
              onClick={() => void save()}
            >
              {saving ? "Salvando…" : "Salvar anúncio"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
