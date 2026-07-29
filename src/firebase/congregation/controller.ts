import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import type { Congregation } from "./types";

export function useCongregation(id?: string | null) {
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    const getCongregation = async () => {
      setCongregation(null);
      setError(null);

      if (!id) {
        setResolvedId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snapshot = await getDoc(doc(db, "congregation", id));

        if (!snapshot.exists()) {
          throw new Error(`Congregation "${id}" was not found`);
        }

        if (active) {
          setCongregation({
            ...(snapshot.data() as Omit<Congregation, "id">),
            id: snapshot.id,
          });
        }
      } catch (error) {
        console.error("Error loading congregation:", error);
        if (active) {
          setError(
            error instanceof Error
              ? error
              : new Error("Failed to load congregation")
          );
        }
      } finally {
        if (active) {
          setResolvedId(id);
          setLoading(false);
        }
      }
    };

    void getCongregation();

    return () => {
      active = false;
    };
  }, [id]);

  if (!id) {
    return {
      congregation: null,
      error: null,
      loading: false,
    };
  }

  const isCurrentDocument = resolvedId === (id ?? null);

  return {
    congregation: isCurrentDocument ? congregation : null,
    error: isCurrentDocument ? error : null,
    loading: loading || !isCurrentDocument,
  };
}
