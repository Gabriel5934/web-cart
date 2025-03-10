import { query, collection, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useContext, useEffect, useState } from "react";
import _ from "lodash";
import { Booking } from "./types";
import {
  formatBookings,
  getLastBookingForDevices,
  groupByDates,
} from "./service";
import { Context } from "@/app/context";

export function useGetBookings(showSucces: boolean, showError: boolean) {
  const context = useContext(Context);
  const [bookings, setBookings] = useState<Array<Booking>>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<Array<keyof _.Dictionary<Booking[]>>>([]);
  const [bookingsByDate, setBookingsByDate] = useState<_.Dictionary<Booking[]>>(
    {}
  );
  const [lastBookings, setLastBookings] = useState<
    Record<string, Booking | undefined>
  >({
    "Carrinho 1": undefined,
    "Carrinho 2": undefined,
    Display: undefined,
  });

  async function fetchData(backwardsRange: number = 0) {
    try {
      setLoading(true);

      const q = query(collection(db, "bookings"), orderBy("date"));
      const querySnapshot = await getDocs(q);

      const bookings = formatBookings(querySnapshot);
      const { grouped, dates } = groupByDates(bookings, backwardsRange);
      const toBeLastBookings = getLastBookingForDevices(bookings);

      if (showSucces) {
        context.openSnackBar({
          severity: "success",
          message: `${bookings.length} reservas encontradas`,
          error: "",
        });
      }

      setBookings(bookings);
      setBookingsByDate(grouped);
      setDates(dates);
      setLastBookings(toBeLastBookings);
    } catch (error) {
      console.log(error);

      if (showError) {
        context.openSnackBar({
          severity: "error",
          message: "Algo deu errado",
          error: `${error}`,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    bookings,
    bookingsByDate,
    dates,
    lastBookings,
    refresh: fetchData,
  };
}
