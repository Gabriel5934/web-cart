import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../firebase";

interface DashboardData {
  registeredUsers: number;
  ministryHoursThisMonth: number;
  deviceUsage: Record<string, number>;
  availableMonths: string[];
}

const EMPTY_DATA: DashboardData = {
  registeredUsers: 0,
  ministryHoursThisMonth: 0,
  deviceUsage: {},
  availableMonths: [],
};

const EMPTY_DEVICES: string[] = [];

export function useDashboard(
  congregationId?: string,
  devices: string[] = EMPTY_DEVICES,
  selectedMonth = dayjs().format("YYYY-MM"),
) {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(Boolean(congregationId));
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isActive = () => requestId === requestIdRef.current;

    if (!congregationId) {
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const phoneBookQuery = query(
        collection(db, "phone-book"),
        where("congregation", "==", congregationId),
      );
      const allBookingsQuery = query(
        collection(db, "new-bookings"),
        where("congregation", "==", congregationId),
        orderBy("date", "desc"),
      );

      const [usersSnapshot, bookingsSnapshot] = await Promise.all([
        getCountFromServer(phoneBookQuery),
        getDocs(allBookingsQuery),
      ]);

      if (!isActive()) return;

      const deviceUsage = Object.fromEntries(
        devices.map((device) => [device, 0]),
      );
      const availableMonths = new Set([selectedMonth]);
      let bookingsInSelectedMonth = 0;

      bookingsSnapshot.forEach((bookingDocument) => {
        const booking = bookingDocument.data() as {
          date?: Timestamp;
          device?: string;
        };

        if (!booking.date) return;

        const bookingDate = dayjs(booking.date.toDate());
        const bookingMonth = bookingDate.format("YYYY-MM");
        availableMonths.add(bookingMonth);

        if (bookingMonth !== selectedMonth) return;

        bookingsInSelectedMonth += 1;
        if (booking.device) {
          deviceUsage[booking.device] =
            (deviceUsage[booking.device] ?? 0) + 1;
        }
      });

      setData({
        registeredUsers: usersSnapshot.data().count,
        ministryHoursThisMonth: bookingsInSelectedMonth * 2,
        deviceUsage,
        availableMonths: Array.from(availableMonths).sort((left, right) =>
          right.localeCompare(left),
        ),
      });
    } catch (caughtError) {
      console.error("Error loading admin dashboard:", caughtError);
      if (isActive()) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error("Failed to load dashboard"),
        );
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [congregationId, devices, selectedMonth]);

  useEffect(() => {
    void fetchData();
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchData]);

  return { ...data, loading, error, refresh: fetchData };
}
