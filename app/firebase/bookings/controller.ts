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
} from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import _ from "lodash";
import { Booking, BookingDoc } from "./types";
import {
  formatBookings,
  getLastBookingForDevices,
  groupByDates,
} from "./service";
import toast from "react-hot-toast";

export const DEV_HOSTNAME = [
  "web-cart-git-develop-gabriel5934s-projects.vercel.app",
  "web-cart-git-main-gabriel5934s-projects.vercel.app",
];

type DeploymentType = "aquarius" | "esplanada";
type Environment = "dev" | "prod";

const getCollectionName = (hostname: string): string => {
  const isDevelopment = DEV_HOSTNAME.includes(hostname);
  const deploy = process.env.NEXT_PUBLIC_DEPLOY as DeploymentType;

  const collections: Record<DeploymentType, Record<Environment, string>> = {
    aquarius: {
      dev: "bookingsDevAquarius",
      prod: "bookingsAquarius",
    },
    esplanada: {
      dev: "bookingsDev",
      prod: "bookings",
    },
  };

  if (deploy && collections[deploy]) {
    return collections[deploy][isDevelopment ? "dev" : "prod"];
  }

  return "noDeployBookings";
};

export function useBookings(showSucces: boolean, showError: boolean) {
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

  async function fetchData(backwardsRange: number = 0) {
    try {
      setLoading(true);

      const q = query(
        collection(db, getCollectionName(window.location.hostname)),
        orderBy("date")
      );
      const querySnapshot = await getDocs(q);

      const bookings = formatBookings(querySnapshot);
      const { grouped, dates } = groupByDates(bookings, backwardsRange);
      const toBeLastBookings = getLastBookingForDevices(bookings);

      if (showSucces) {
        toast.success(`${bookings.length} reservas encontradas`);
      }

      setBookings(bookings);
      setBookingsByDate(grouped);
      setDates(dates);
      setLastBookings(toBeLastBookings);
    } catch (error) {
      console.log(error);

      if (showError) {
        toast.error("Algo deu errado");
      }
    } finally {
      setLoading(false);
    }
  }

  async function addData(booking: Omit<BookingDoc, "id">) {
    try {
      const docRef = await addDoc(
        collection(db, getCollectionName(window.location.hostname)),
        booking
      );

      setNewBooking(docRef.id);

      toast.success("Reserva feita com sucesso");
    } catch (error) {
      console.log(error);
    }
  }

  function deleteData(id: string) {
    return deleteDoc(doc(db, getCollectionName(window.location.hostname), id));
  }

  async function toggleReturned(id: string) {
    const bookingRef = doc(db, getCollectionName(window.location.hostname), id);
    const bookingSnap = await getDoc(bookingRef);
    const data = bookingSnap.data();

    if (!data) return;

    return updateDoc(bookingRef, {
      returned: !data.returned,
    });
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
    newBooking,
    refresh: fetchData,
    addData,
    deleteData,
    toggleReturned,
  };
}
