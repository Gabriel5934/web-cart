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
      date: dayjs(data.date.toDate()),
    };

    bookings.push(formatted);
  });

  return bookings;
}

export function groupByDates(bookings: Array<Booking>, backwardsRange: number) {
  const dateFilteredBookings = _.orderBy(
    bookings.filter((booking) =>
      booking.date.isSameOrAfter(
        dayjs().startOf("day").subtract(backwardsRange, "day")
      )
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

  return _.mapValues(byDevice, (deviceBookings) => {
    const pastBookings = deviceBookings.filter(
      (booking) => !booking.date.isAfter(dayjs())
    );
    const ordered = _.orderBy(pastBookings, "date.$d");
    return _.last(ordered);
  });
}
