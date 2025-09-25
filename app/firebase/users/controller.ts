import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { UserDoc } from "./types";
import toast from "react-hot-toast";

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<UserDoc>>([]);

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

  useEffect(() => {
    getUsers();
  }, []);

  return { loading, getUsers, users };
};
