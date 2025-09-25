"use server";

import { query, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { UserDoc } from "./firebase/users/types";
import { cookies } from "next/headers";

const normalizeString = (str: string) => {
  return str
    .replaceAll(" ", "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export async function login(formData: { user: string; pinCode: string }) {
  const q = query(collection(db, "users"));
  const querySnapshot = await getDocs(q);

  const users = querySnapshot.docs.map((doc) => ({
    ...(doc.data() as UserDoc),
  })) as UserDoc[];

  try {
    const loggedInUser =
      users.find(
        (currUser) =>
          normalizeString(currUser.user) === normalizeString(formData.user) &&
          `${currUser.pinCode}` === formData.pinCode
      ) ?? null;

    if (!loggedInUser) throw new Error(undefined, { cause: 401 });

    const cookieStore = await cookies();
    cookieStore.set("user", JSON.stringify(loggedInUser));
  } catch (_e) {
    const error = _e as Error;
    if (error.cause === 401) {
      throw new Error("Usuário ou senha inválidos");
    } else {
      throw new Error("Algo deu errado, tente novamente mais tarde");
    }
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const user = cookieStore.get("user")?.value ?? null;
  return user ? (JSON.parse(user) as UserDoc) : null;
}
