import { collection, getDocs, query } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { UserDoc } from "./types";
import { Context } from "@/app/context";
import toast from "react-hot-toast";

export const useUsers = () => {
  const context = useContext(Context);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<UserDoc>>([]);

  const normalizeString = (str: string) => {
    return str
      .replaceAll(" ", "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const getUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as UserDoc),
      })) as UserDoc[];
      setUsers(users);
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, code: string) => {
    try {
      setLoading(true);

      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);

      const users = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as UserDoc),
      })) as UserDoc[];

      const user = users.find(
        (user) =>
          normalizeString(user.user) === normalizeString(username) &&
          `${user.pinCode}` === `${code}`
      );

      if (!user)
        throw new Error("Usuário ou senha incorretos", { cause: "AUTH_ERROR" });

      context.auth.setUser(user);
    } catch (error) {
      console.error("Error logging in:", error);
      if ((error as Error).cause === "AUTH_ERROR") {
        toast.error("Usuário ou senha incorretos");
      } else {
        toast.error("Algo deu errado, tente novamente mais tarde");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  return { signIn, loading, getUsers, users };
};
