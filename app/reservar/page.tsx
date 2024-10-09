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
import {
  LocalizationProvider,
  MobileDatePicker,
  MobileTimePicker,
} from "@mui/x-date-pickers";
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
import _ from "lodash";

interface Inputs {
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs | null;
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

export default function Page() {
  const router = useRouter();
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [bookings, setBookings] = useState<Array<Booking>>([]);
  const [blockingInitialBookings, setBlockingInitialBooking] =
    useState<string>();

  const places = ["14 Bis", "Ribeirão Vermelho", "Itaú", "Feira do Urbanova"];

  const devices = ["Carrinho Geral", "Carrinho Vicentina", "Display"];

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
    initialTime: string().required(requiredMessage),
    endTime: string()
      .required(requiredMessage)
      .test(
        "available",
        () => "",
        () => !Boolean(blockingInitialBookings)
      ),
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
    shouldCheckTime?: boolean;
  }) => {
    const { formik, field, label, options, disabled, value, shouldCheckTime } =
      props;

    const handleChange = (_e: any, value: string | null) => {
      formik.setFieldValue(field, value);

      if (shouldCheckTime) {
        checkAvailability(
          value ?? "",
          formik.values.date,
          formik.values.initialTime,
          formik.values.endTime
        );
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
        onChange={handleChange}
        disabled={disabled ?? false}
      />
    );
  };

  const checkAvailability = (
    device: string,
    date: Dayjs | null,
    initialTime: Dayjs | null,
    endTime: Dayjs | null
  ) => {
    if (!initialTime || !endTime || !date) return;

    const currentDayBookings = bookings.filter((booking) =>
      dayjs(booking.date).isSame(date, "day")
    );
    const currentDeviceBookings = currentDayBookings.filter(
      (booking) => booking.device === device
    );
    const orderByTime = _.orderBy(currentDeviceBookings, "initialTime");
    const bookedTimes = orderByTime
      .map((booking) => [booking.initialTime, booking.endTime])
      .flat();

    const overlaps = bookedTimes.filter((time) =>
      dayjs(time).isBetween(initialTime, endTime)
    );

    if (overlaps[0]) {
      setBlockingInitialBooking(
        `Já existe uma reserva às ${dayjs(overlaps[0]).format("HH:mm")}`
      );
    } else {
      setBlockingInitialBooking(undefined);
    }
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
                  options={devices}
                  label="Dispositivo"
                  formik={formik}
                  field="device"
                  shouldCheckTime
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
                        options={places}
                        label="Local"
                        formik={formik}
                        field="place"
                        value={
                          formik.values.device === "Carrinho Vicentina"
                            ? "Vicentina Aranha"
                            : formik.values.place
                        }
                        disabled={formik.values.device === "Carrinho Vicentina"}
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
                            checkAvailability(
                              formik.values.device,
                              value,
                              formik.values.initialTime,
                              formik.values.endTime
                            );

                            formik.setFieldValue("date", value);
                          }}
                          value={formik.values.date}
                        />
                        <FormHelperText>{formik.errors.date}</FormHelperText>
                      </FormControl>
                      <FormControl
                        error={Boolean(formik.errors.initialTime)}
                        sx={{ width: "100%" }}
                      >
                        <MobileTimePicker
                          name="time"
                          label="Início"
                          sx={{ width: "100%" }}
                          onChange={(value) => {
                            formik.setFieldValue("endTime", null);
                            setBlockingInitialBooking(undefined);
                            formik.setFieldValue("initialTime", value);
                          }}
                          value={formik.values.initialTime}
                        />
                        <FormHelperText>
                          {formik.errors.initialTime}
                        </FormHelperText>
                      </FormControl>
                      <FormControl
                        error={Boolean(formik.errors.endTime)}
                        sx={{ width: "100%" }}
                      >
                        <MobileTimePicker
                          name="time"
                          label="Fim"
                          sx={{ width: "100%" }}
                          onChange={(value) => {
                            checkAvailability(
                              formik.values.device,
                              formik.values.date,
                              formik.values.initialTime,
                              value
                            );
                            formik.setFieldValue("endTime", value);
                          }}
                          value={formik.values.endTime}
                          disabled={!formik.values.initialTime}
                          {...(formik.values.initialTime
                            ? {
                                minTime: formik.values.initialTime.add(
                                  1,
                                  "hour"
                                ),
                                maxTime: formik.values.initialTime.add(
                                  2,
                                  "hour"
                                ),
                              }
                            : {})}
                        />

                        <FormHelperText error={true}>
                          {blockingInitialBookings}
                        </FormHelperText>

                        {formik.values.initialTime ? (
                          <>
                            <FormHelperText>
                              {formik.errors.endTime}
                            </FormHelperText>
                            <FormHelperText error={false}>
                              Duração Permitida de 1 até 2 horas
                            </FormHelperText>
                          </>
                        ) : (
                          <FormHelperText error={false}>
                            Selecione a hora de início
                          </FormHelperText>
                        )}
                        {formik.values.initialTime && formik.values.endTime && (
                          <FormHelperText error={false}>
                            {"Duração: "}
                            {dayjs
                              .duration(
                                formik.values.endTime.diff(
                                  formik.values.initialTime,
                                  "minutes"
                                ),
                                "minute"
                              )
                              .format("HH:mm")}
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
