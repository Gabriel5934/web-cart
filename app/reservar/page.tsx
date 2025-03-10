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
import { ChangeEvent, useState } from "react";
import { Formik, FormikProps } from "formik";
import { object, string } from "yup";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import dayjs, { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import PersonIcon from "@mui/icons-material/Person";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { LocationOn } from "@mui/icons-material";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";
import {
  DEV_HOSTNAME,
  useAddBooking,
  useGetBookings,
} from "../firebase/bookings/controller";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface Inputs {
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs | null;
  timeString: string;
}

interface BookingDoc {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
  returned: boolean;
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
  "17:00 - 19:00",
  "19:00 - 21:00",
];

const PLACES = [
  "Portaria 14 Bis",
  "Feira Santa Clara",
  "Praça Romão Gomes",
  "Parque Ribeirão Vermelho",
  "Feira do Urbanova",
  "Vicentina Aranha",
];

const DEVICES = ["Carrinho 1", "Carrinho 2", "Display 1", "Display 2"];

const BOOKED = "Reservado";

export default function Page() {
  const { bookings, loading } = useGetBookings(false, true);
  const { add } = useAddBooking();

  const router = useRouter();
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [timeStringOptions, setTimeStringOptions] = useState<Array<string>>([]);

  const closeSnackbar = () => setSnackbarOpen(false);

  const onSubmit = async (values: Inputs) => {
    if (!values.date) return;

    const formatted: Omit<BookingDoc, "id"> = {
      ...values,
      date: Timestamp.fromDate(values.date.toDate()),
      returned: false,
    };

    try {
      setShowBackdrop(true);
      const docRef = await add(formatted);
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

      if (formik.values.date) {
        blockTimeStringOptions(formik.values.date, newDevice);
      }

      if (newDevice === "Carrinho 2") {
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

  const blockTimeStringOptions = (newDate: Dayjs | null, device: string) => {
    if (!newDate) return;

    const currentContextsBookings = bookings.filter(
      (booking) =>
        booking.date.isSame(newDate, "day") && booking.device === device
    );

    const bookedOptions = currentContextsBookings.map((booking) => {
      return `${booking.date.format("HH:mm")} - ${booking.date
        .add(2, "hour")
        .format("HH:mm")}`;
    });

    const newOptions = OPENINGS.map((opening) =>
      bookedOptions.includes(opening) ? `${opening} (${BOOKED})` : opening
    );

    setTimeStringOptions(newOptions);
  };

  const handleTimeChange = (
    formik: FormikProps<Inputs>,
    value: string | null
  ) => {
    if (!formik.values.date || !value) return;

    formik.setFieldValue("timeString", value);

    const initialHour = +value.split(" - ")[0].split(":")[0];
    const initialMinute = +value.split(" - ")[0].split(":")[1];

    const newDate = formik.values.date
      .set("hour", initialHour)
      .set("minute", initialMinute);

    formik.setFieldValue("date", newDate);
  };

  const shouldDisablePast = () => {
    const hostName = window.location.hostname;

    return hostName === DEV_HOSTNAME ? false : true;
  };

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
        {loading ? (
          <Skeleton height={500} width={400} count={1} />
        ) : (
          <Formik<Inputs>
            initialValues={{
              device: "",
              name: "",
              partner: "",
              place: "",
              date: null,
              timeString: "",
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
                          disabled={formik.values.device === "Carrinho 2"}
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
                            disablePast={shouldDisablePast()}
                            onChange={(value) => {
                              blockTimeStringOptions(
                                value,
                                formik.values.device
                              );
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
                            options={timeStringOptions}
                            getOptionDisabled={(option) =>
                              option.includes(BOOKED)
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
        )}
      </div>
    </>
  );
}
