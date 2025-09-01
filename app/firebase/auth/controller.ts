import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useContext } from "react";
import { Context } from "@/app/context";

export const useLoginWithEmailAndPassword = () => {
  const context = useContext(Context);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        context.auth.setUser(user);
      })
      .catch((error) => {
        console.error("Error signing in:", error);
      });

  return { signIn };
};
