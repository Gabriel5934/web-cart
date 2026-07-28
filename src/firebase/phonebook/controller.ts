import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import type { PhoneBookEntry } from "./types";

export function usePhoneBook(phoneNumber?: string | null) {
  const [entry, setEntry] = useState<PhoneBookEntry | null>(null);
  const [loading, setLoading] = useState(Boolean(phoneNumber));
  const [resolvedPhoneNumber, setResolvedPhoneNumber] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;

    const getEntry = async () => {
      setEntry(null);

      if (!phoneNumber) {
        setResolvedPhoneNumber(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snapshot = await getDoc(doc(db, "phone-book", phoneNumber));

        if (active && snapshot.exists()) {
          setEntry(snapshot.data() as PhoneBookEntry);
        }
      } catch (error) {
        console.error("Error loading phone-book profile:", error);
      } finally {
        if (active) {
          setResolvedPhoneNumber(phoneNumber);
          setLoading(false);
        }
      }
    };

    void getEntry();

    return () => {
      active = false;
    };
  }, [phoneNumber]);

  const saveEntry = async (nextEntry: PhoneBookEntry) => {
    await setDoc(doc(db, "phone-book", nextEntry.phoneNumber), {
      ...nextEntry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setEntry(nextEntry);
    setResolvedPhoneNumber(nextEntry.phoneNumber);
  };

  const isCurrentDocument = resolvedPhoneNumber === (phoneNumber ?? null);

  return {
    entry: isCurrentDocument ? entry : null,
    loading: loading || !isCurrentDocument,
    saveEntry,
    setEntry,
  };
}
