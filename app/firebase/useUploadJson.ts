import { collection, doc, setDoc } from "firebase/firestore";
import { users } from "../users";
import { db } from "./firebase";
import { useUsers } from "./users/controller";

export default function useUploadJson() {
  const { read } = useUsers();

  const upload = async () => {
    try {
      const existingUsers = await read();
      const newUsers = users.filter(
        (newUser) =>
          !existingUsers.some(
            (existingUser) => existingUser.user === newUser.user
          )
      );

      for (const user of newUsers) {
        const docRef = doc(collection(db, "users"));
        await setDoc(docRef, user);
      }

      alert(`${newUsers.length} new users uploaded.`);
    } catch (error) {
      alert("Check console for error");
      console.error("Error uploading users:", error);
    }
  };

  return { upload };
}
