"use client";

import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import { Formik, FormikProps } from "formik";
import { object, string } from "yup";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import dayjs, { Dayjs } from "dayjs";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { LocationOn } from "@mui/icons-material";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";

interface Inputs {
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs | null;
  timeString: string;
  initialTime: Dayjs | null;
  endTime: Dayjs | null;
}

interface BookingDoc {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
  initialTime: Timestamp;
  endTime: Timestamp;
}

interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Date;
  initialTime: Date;
  endTime: Date;
}

dayjs.locale("pt-br");

dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(relativeTime);

const OPENINGS = [
  "06:00 - 08:00",
  "08:00 - 10:00",
  "10:00 - 12:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "19:00 - 21:00",
];

const PLACES = [
  "Portaria 14 Bis",
  "Feira Santa Clara",
  "Praça Romão Gomes",
  "Parque Ribeirão Vermelho",
  "Feira do Urbanova",
];

const DEVICES = ["Carrinho 1", "Carrinho 2 (Vicentina)", "Display"];

export default function Page() {
  const router = useRouter();
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [bookings, setBookings] = useState<Array<Booking>>([]);

  const closeSnackbar = () => setSnackbarOpen(false);

  const onSubmit = async (values: Inputs) => {
    if (!values.date || !values.initialTime || !values.endTime) return;

    const formatted = {
      ...values,
      date: Timestamp.fromDate(values.date.toDate()),
      initialTime: Timestamp.fromDate(values.initialTime.toDate()),
      endTime: Timestamp.fromDate(values.endTime.toDate()),
    };

    try {
      setShowBackdrop(true);
      const docRef = await addDoc(collection(db, "bookings"), formatted);
      router.push(`/?success=true&id=${docRef.id}`);
    } catch (e) {
      setShowBackdrop(false);
      console.error("Error adding document: ", e);
      setSnackbarOpen(true);
    }
  };

  const requiredMessage = "Campo Obrigatório";

  const schema = object({
    device: string().required(requiredMessage),
    name: string().required(requiredMessage),
    partner: string().required(requiredMessage),
    place: string().required(requiredMessage),
    date: string().required(requiredMessage),
    timeString: string().required(requiredMessage),
  });

  const CustomTextField = (props: {
    label: string;
    field: keyof Inputs;
    formik: FormikProps<Inputs>;
    pipe?: (value: string) => string;
  }) => {
    const { label, field, formik, pipe } = props;

    const onChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      if (pipe) {
        e.target.value = pipe(e.target.value);
      }

      return formik.handleChange(e);
    };

    return (
      <TextField
        fullWidth
        label={label}
        variant="outlined"
        name={field}
        value={formik.values[field]}
        onChange={onChange}
        error={Boolean(formik.errors[field])}
        helperText={formik.errors[field]}
      />
    );
  };

  const CustomAutocomplete = (props: {
    label: string;
    field: keyof Inputs;
    formik: FormikProps<Inputs>;
    options: Array<string>;
    disabled?: boolean;
    value?: string;
    checkForVicentina?: boolean;
  }) => {
    const {
      formik,
      field,
      label,
      options,
      disabled,
      value,
      checkForVicentina,
    } = props;

    const updatePlace = (newDevice: string) => {
      if (!checkForVicentina) return;

      if (newDevice === "Carrinho 2 (Vicentina)") {
        formik.setFieldValue("place", "Vicentina Aranha");
      } else if (formik.values.place === "Vicentina Aranha") {
        formik.setFieldValue("place", "");
      }
    };

    return (
      <Autocomplete
        fullWidth
        disablePortal
        options={options}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={Boolean(formik.errors[field])}
            helperText={formik.errors[field]}
          />
        )}
        value={value ?? (formik.values[field] as string)}
        onChange={(_e, value) => {
          formik.setFieldValue(field, value);
          updatePlace(value ?? "");
        }}
        disabled={disabled ?? false}
      />
    );
  };

  const fetchData = async () => {
    const q = query(collection(db, "bookings"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const bookings: Array<Booking> = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as BookingDoc;
      const formatted = {
        ...data,
        id: doc.id,
        date: data.date.toDate(),
        initialTime: data.initialTime.toDate(),
        endTime: data.endTime.toDate(),
      };

      bookings.push(formatted);
    });

    setBookings(bookings);
  };

  const testOption = (option: string, values: Inputs) => {
    const { date, device } = values;

    const currentContextsBookings = bookings.filter(
      (booking) =>
        dayjs(booking.date).isSame(date, "day") && booking.device === device
    );

    const bookedOptions = currentContextsBookings.map((booking) => {
      return `${dayjs(booking.initialTime).format("HH:mm")} - ${dayjs(
        booking.endTime
      ).format("HH:mm")}`;
    });

    return bookedOptions.includes(option);
  };

  const handleTimeChange = (
    formik: FormikProps<Inputs>,
    value: string | null
  ) => {
    if (!formik.values.date || !value) return;

    formik.setFieldValue("timeString", value);

    const initialHour = +value.split(" - ")[0].split(":")[0];
    const initialMinute = +value.split(" - ")[0].split(":")[1];
    const endHour = +value.split(" - ")[1].split(":")[0];
    const endMinute = +value.split(" - ")[1].split(":")[1];

    const initialTime = formik.values.date
      .set("hour", initialHour)
      .set("minute", initialMinute);
    const endTime = formik.values.date
      .set("hour", endHour)
      .set("minute", endMinute);

    formik.setFieldValue("initialTime", initialTime);
    formik.setFieldValue("endTime", endTime);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={showBackdrop}
        onClick={() => {}}
      >
        <CircularProgress />
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={closeSnackbar}
      >
        <Alert
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
          onClose={closeSnackbar}
        >
          Algo deu errado, tente novamente
        </Alert>
      </Snackbar>

      <Box
        sx={(theme) => ({ bgcolor: theme.palette.primary.main })}
        className="px-4 pt-20 pb-4"
      >
        <Typography variant="h4" color="white">
          Fazer Reserva
        </Typography>
      </Box>

      <div className="flex flex-col p-8 gap-4 items-center">
        <Formik<Inputs>
          initialValues={{
            device: "",
            name: "",
            partner: "",
            place: "",
            date: null,
            timeString: "",
            initialTime: null,
            endTime: null,
          }}
          onSubmit={onSubmit}
          validationSchema={schema}
          validateOnChange={false}
        >
          {(formik) => (
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="pt-br"
            >
              <form
                onSubmit={formik.handleSubmit}
                className="flex flex-col items-center gap-4 w-full"
              >
                <CustomAutocomplete
                  options={DEVICES}
                  label="Dispositivo"
                  formik={formik}
                  field="device"
                  checkForVicentina
                />
                <div className="flex flex-col w-full gap-8 py-4">
                  <div className="flex gap-2 w-full">
                    <div className="py-2">
                      <PersonIcon />
                    </div>
                    <div className="flex gap-4 flex-col w-full">
                      <CustomTextField
                        label="Seu Nome"
                        field="name"
                        formik={formik}
                      />
                      <CustomTextField
                        label="Nome do companheiro(a)"
                        field="partner"
                        formik={formik}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="py-2">
                      <LocationOn />
                    </div>
                    <div className="flex gap-4 flex-col w-full">
                      <CustomAutocomplete
                        options={PLACES}
                        label="Local"
                        formik={formik}
                        field="place"
                        value={formik.values.place}
                        disabled={
                          formik.values.device === "Carrinho 2 (Vicentina)"
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 w-full">
                    <div className="py-2">
                      <ScheduleIcon />
                    </div>
                    <div className="flex gap-4 flex-col w-full">
                      <FormControl
                        error={Boolean(formik.errors.date)}
                        sx={{ width: "100%" }}
                      >
                        <MobileDatePicker
                          name="date"
                          label="Data"
                          disablePast
                          onChange={(value) => {
                            formik.setFieldValue("timeString", "");
                            formik.setFieldValue("date", value);
                          }}
                          value={formik.values.date}
                        />
                        <FormHelperText>{formik.errors.date}</FormHelperText>
                      </FormControl>
                      <FormControl>
                        <Autocomplete
                          fullWidth
                          disablePortal
                          disabled={
                            !formik.values.date || !formik.values.device
                          }
                          options={OPENINGS}
                          getOptionDisabled={(option) =>
                            testOption(option, formik.values)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={"Horário"}
                              error={Boolean(formik.errors.timeString)}
                              helperText={formik.errors.timeString}
                            />
                          )}
                          value={formik.values.timeString}
                          onChange={(_e, value) =>
                            handleTimeChange(formik, value)
                          }
                        />
                        {!formik.values.device ? (
                          <FormHelperText>
                            Selecione um dispositivo
                          </FormHelperText>
                        ) : (
                          <FormHelperText>
                            {!formik.values.date && "Selecione uma data"}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </div>
                  </div>
                </div>
                <div className="flex w-full justify-end">
                  <Button variant="contained" type="submit" size="large">
                    reservar
                  </Button>
                </div>
              </form>
            </LocalizationProvider>
          )}
        </Formik>
      </div>
    </>
  );
}
