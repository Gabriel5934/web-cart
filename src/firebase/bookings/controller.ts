import {
  query,
  collection,
  getDocs,
  orderBy,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useContext, useEffect, useState } from "react";
import _ from "lodash";
import { Booking, BookingDoc } from "./types";
import {
  formatBookings,
  getBookingsWithinWindow,
  getLastBookingForDevices,
  getUniqueUsers,
  groupByDates,
} from "./service";
import toast from "react-hot-toast";
import { Context } from "@/context";

export const DEV_HOSTNAME = [
  "web-cart-git-develop-gabriel5934s-projects.vercel.app",
  "web-cart-git-main-gabriel5934s-projects.vercel.app",
];

const BOOKINGS_COLLECTION = "new-bookings";

export function useBookings(
  showSucces: boolean,
  showError: boolean,
  initialBackwardsRange?: number
) {
  const context = useContext(Context);
  const congregationId =
    context.phoneBook.entry?.congregation ?? context.congregation.data?.id;
  const [bookings, setBookings] = useState<Array<Booking>>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<Array<keyof _.Dictionary<Booking[]>>>([]);
  const [bookingsByDate, setBookingsByDate] = useState<_.Dictionary<Booking[]>>(
    {}
  );
  const [lastBookings, setLastBookings] = useState<
    Record<string, Booking | undefined>
  >({});
  const [newBooking, setNewBooking] = useState<string | null>(null);
  const [uniqueUsers, setUniqueUsers] = useState<Array<string>>([]);
  const [bookingsWithinWindow, setBookingsWithinWindow] = useState<
    Array<Booking>
  >([]);

  async function fetchData(options: {
    backwardsRange?: number;
    user?: string;
  }) {
    try {
      setLoading(true);

      if (!congregationId) {
        setBookings([]);
        setBookingsByDate({});
        setDates([]);
        setLastBookings({});
        setUniqueUsers([]);
        setBookingsWithinWindow([]);
        return;
      }

      const q = query(
        collection(db, BOOKINGS_COLLECTION),
        where("congregation", "==", congregationId),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);

      const bookings = formatBookings(querySnapshot);
      const filteredByUser = options.user
        ? bookings.filter((booking) => booking.owner === options.user)
        : bookings;
      const { grouped, dates } = groupByDates(
        filteredByUser,
        options.backwardsRange ?? initialBackwardsRange ?? 0
      );
      const toBeLastBookings = getLastBookingForDevices(filteredByUser);
      if (showSucces) {
        toast.success(`${filteredByUser.length} reservas encontradas`);
      }
      const toBeUniqueUsers = getUniqueUsers(filteredByUser);
      const toBeBookingsWithinWindow = getBookingsWithinWindow(
        filteredByUser,
        options.backwardsRange ?? initialBackwardsRange ?? 0
      );

      setBookings(filteredByUser);
      setBookingsByDate(grouped);
      setDates(dates);
      setLastBookings(toBeLastBookings);
      setUniqueUsers(toBeUniqueUsers);
      setBookingsWithinWindow(toBeBookingsWithinWindow);
    } catch (error) {
      console.log(error);

      if (showError) {
        toast.error("Algo deu errado");
      }
    } finally {
      setLoading(false);
    }
  }

  async function addData(
    booking: Omit<BookingDoc, "id" | "congregation">
  ) {
    try {
      if (!congregationId) {
        throw new Error("Cannot create a booking without a congregation");
      }

      const docRef = await addDoc(
        collection(db, BOOKINGS_COLLECTION),
        { ...booking, congregation: congregationId }
      );

      setNewBooking(docRef.id);

      toast.success("Reserva feita com sucesso");
    } catch (error) {
      console.log(error);
    }
  }

  function deleteData(id: string) {
    return deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
  }

  async function toggleReturned(id: string) {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
    const bookingSnap = await getDoc(bookingRef);
    const data = bookingSnap.data();

    if (!data) return;

    return updateDoc(bookingRef, {
      returned: !data.returned,
    });
  }

  useEffect(() => {
    fetchData({});
  }, [congregationId]);

  return {
    loading,
    bookings,
    bookingsByDate,
    dates,
    lastBookings,
    newBooking,
    refresh: fetchData,
    addData,
    deleteData,
    toggleReturned,
    uniqueUsers,
    bookingsWithinWindow,
  };
}
