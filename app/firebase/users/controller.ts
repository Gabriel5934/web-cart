import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { UserDoc } from "./types";

async function getUsers() {
  const q = query(collection(db, "users"));
  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs.map((doc) => ({
    ...(doc.data() as UserDoc),
  })) as UserDoc[];
  return users;
}

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Array<UserDoc>>([]);

  const read = async () => {
    try {
      setLoading(true);
      const users = await getUsers();
      setData(users);
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    read();
  }, []);

  return { loading, read, data };
};

const normalizeString = (str: string) => {
  return str
    .replaceAll(" ", "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export async function login(formData: { user: string; pinCode: string }) {
  const users = await getUsers();

  try {
    const loggedInUser =
      users.find(
        (currUser) =>
          normalizeString(currUser.user) === normalizeString(formData.user) &&
          `${currUser.pinCode}` === formData.pinCode
      ) ?? null;

    if (!loggedInUser) throw new Error(undefined, { cause: 401 });

    localStorage.setItem("user", JSON.stringify(loggedInUser));
  } catch (_e) {
    const error = _e as Error;

    switch (error.cause) {
      case 401:
        throw new Error("Usuário ou senha inválidos");
      default:
        throw new Error("Algo deu errado, tente novamente mais tarde");
    }
  }
}
