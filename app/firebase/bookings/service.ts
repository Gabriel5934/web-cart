import dayjs from "dayjs";
import { QuerySnapshot, DocumentData } from "firebase/firestore";
import { Booking, BookingDoc } from "./types";
import _ from "lodash";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);

export function formatBookings(
  snapshot: QuerySnapshot<DocumentData, DocumentData>
) {
  const bookings: Array<Booking> = [];

  snapshot.forEach((doc) => {
    const data = doc.data() as BookingDoc;
    const formatted: Booking = {
      ...data,
      id: doc.id,
      date: dayjs(data.date.toDate()),
    };

    bookings.push(formatted);
  });

  return bookings;
}

export function groupByDates(bookings: Array<Booking>) {
  const dateFilteredBookings = _.orderBy(
    bookings.filter((booking) =>
      booking.date.isSameOrAfter(dayjs().startOf("day"))
    ),
    "initialTime"
  );

  const grouped = _.groupBy(dateFilteredBookings, (booking) =>
    booking.date.startOf("day")
  );

  return { grouped, dates: Object.keys(grouped) };
}

export function getLastBookingForDevices(bookings: Array<Booking>) {
  const byDevice = _.groupBy(bookings, "device");
  const toBeLastBookings: Record<string, Booking | undefined> = {
    "Carrinho 1": undefined,
    "Carrinho 2": undefined,
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

  return toBeLastBookings;
}
