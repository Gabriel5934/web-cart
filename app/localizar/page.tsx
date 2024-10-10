"use client";

import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import {
  Timestamp,
  query,
  collection,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import _ from "lodash";
import dayjs, { Dayjs } from "dayjs";

interface BookingDoc {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
  returned: boolean;
}

interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs;
  returned: boolean;
}

export default function Page() {
  const [lastBookings, setLastBookings] = useState<
    Record<string, Booking | undefined>
  >({
    "Carrinho 1": undefined,
    "Carrinho 2 (Vicentina)": undefined,
    Display: undefined,
  });

  const fetchData = async () => {
    const q = query(collection(db, "bookings"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const bookings: Array<Booking> = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as BookingDoc;
      const formatted: Booking = {
        ...data,
        id: doc.id,
        date: dayjs(data.date.toDate()),
        returned: data.returned ?? false,
      };

      bookings.push(formatted);
    });

    const byDevice = _.groupBy(bookings, "device");
    const toBeLastBookings: Record<string, Booking | undefined> = {
      "Carrinho 1": undefined,
      "Carrinho 2 (Vicentina)": undefined,
      Display: undefined,
    };

    _.forEach(byDevice, (value, key) => {
      const pastBookings = value.filter(
        (booking) => !booking.date.isAfter(dayjs())
      );
      const ordered = _.orderBy(pastBookings, "date.$d");
      const last = _.last(ordered);

      toBeLastBookings[key] = last;
    });

    setLastBookings(toBeLastBookings);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Box
        sx={(theme) => ({ bgcolor: theme.palette.primary.main })}
        className="px-4 pt-20 pb-4"
      >
        <Typography variant="h4" color="white">
          Localizar
        </Typography>
      </Box>
      <Box sx={{ padding: 4 }}>
        <Stack spacing={1}>
          <Alert severity="info">
            {
              'Para informar que você devolveu o carrinho ou display no salão, clique na sua reserva na tela de Início e depois em "Devolver"'
            }
          </Alert>
          {Object.keys(lastBookings).map((key: keyof typeof lastBookings) => (
            <Paper
              sx={{
                bgcolor: "primary.main",
                color: "white",
              }}
              key={key}
              className="flex flex-col p-4 rounded-md text-white w-full"
            >
              <Stack spacing={1}>
                <Typography variant="h5">{key}</Typography>
                <Box>
                  <Typography>{`Usado por último por: ${
                    lastBookings[key]?.name ?? "Ninguém"
                  }`}</Typography>
                  <Typography>{`${
                    lastBookings[key]?.date.format("DD/MM/YYYY, HH:mm") ?? ""
                  }`}</Typography>
                </Box>
                <Typography>
                  Retornado ao salão? <br />
                  {lastBookings[key]?.returned ? "Sim" : "Não"}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    </>
  );
}
