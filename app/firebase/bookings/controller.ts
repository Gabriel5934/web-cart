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
import { useContext, useEffect, useState } from "react";
import _ from "lodash";
import { Booking, BookingDoc } from "./types";
import {
  formatBookings,
  getLastBookingForDevices,
  groupByDates,
} from "./service";
import { Context } from "@/app/context";

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

      const q = query(
        collection(db, getCollectionName(window.location.hostname)),
        orderBy("date")
      );
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

  function addData(booking: Omit<BookingDoc, "id">) {
    const docRef = addDoc(
      collection(db, getCollectionName(window.location.hostname)),
      booking
    );
    return docRef;
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
    refresh: fetchData,
    addData,
    deleteData,
    toggleReturned,
  };
}
