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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const getEntry = async () => {
      setEntry(null);
      setError(null);

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
        if (active) {
          setError(
            error instanceof Error
              ? error
              : new Error("Failed to load phone-book profile")
          );
        }
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
    const entryRef = doc(db, "phone-book", nextEntry.phoneNumber);
    const existingEntry = await getDoc(entryRef);
    await setDoc(entryRef, {
      ...nextEntry,
      ...(existingEntry.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setEntry(nextEntry);
    setResolvedPhoneNumber(nextEntry.phoneNumber);
  };

  const isCurrentDocument = resolvedPhoneNumber === (phoneNumber ?? null);

  return {
    entry: isCurrentDocument ? entry : null,
    error: isCurrentDocument ? error : null,
    loading: loading || !isCurrentDocument,
    saveEntry,
    setEntry,
  };
}
