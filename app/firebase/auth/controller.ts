import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useContext } from "react";
import { Context } from "@/app/context";
import toast from "react-hot-toast";

export const useLoginWithEmailAndPassword = () => {
  const context = useContext(Context);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      context.auth.setUser(user);
    } catch (error) {
      toast.error("Email ou senha incorretos");
      console.error("Error signing in:", error);
    }
  };

  return { signIn };
};
