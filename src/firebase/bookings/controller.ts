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
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Booking, BookingDoc } from "./types";
import {
  formatBookings,
  getBookingsWithinWindow,
  getLastBookingForDevices,
  getUniqueUsers,
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
  const congregationId = context.phoneBook.entry?.congregation;
  const [bookings, setBookings] = useState<Array<Booking>>([]);
  const [loading, setLoading] = useState(true);
  const [lastBookings, setLastBookings] = useState<
    Record<string, Booking | undefined>
  >({});
  const [newBooking, setNewBooking] = useState<string | null>(null);
  const [uniqueUsers, setUniqueUsers] = useState<Array<string>>([]);
  const [bookingsWithinWindow, setBookingsWithinWindow] = useState<
    Array<Booking>
  >([]);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(
    async () => {
      const requestId = ++requestIdRef.current;
      const isActive = () => requestId === requestIdRef.current;

      try {
        setLoading(true);

        if (!congregationId) {
          if (isActive()) {
            setBookings([]);
            setLastBookings({});
            setUniqueUsers([]);
            setBookingsWithinWindow([]);
          }
          return;
        }

        const q = query(
          collection(db, BOOKINGS_COLLECTION),
          where("congregation", "==", congregationId),
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);

        if (!isActive()) return;

        const bookings = formatBookings(querySnapshot);
        const toBeLastBookings = getLastBookingForDevices(bookings);
        if (showSucces) {
          toast.success(`${bookings.length} reservas encontradas`);
        }
        const toBeUniqueUsers = getUniqueUsers(bookings);
        const toBeBookingsWithinWindow = getBookingsWithinWindow(
          bookings,
          initialBackwardsRange ?? 0
        );

        setBookings(bookings);
        setLastBookings(toBeLastBookings);
        setUniqueUsers(toBeUniqueUsers);
        setBookingsWithinWindow(toBeBookingsWithinWindow);
      } catch (error) {
        console.log(error);

        if (isActive() && showError) {
          toast.error("Algo deu errado");
        }
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [congregationId, initialBackwardsRange, showError, showSucces]
  );

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
      toast.error("Não foi possível fazer a reserva");
      throw error;
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
    void fetchData();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchData]);

  return {
    loading,
    bookings,
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
