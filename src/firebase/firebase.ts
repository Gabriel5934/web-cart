import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjAn0oHBgfUKhOXnxMbigq6W64CT9m4J8",
  authDomain: "web-cart-53976.firebaseapp.com",
  projectId: "web-cart-53976",
  storageBucket: "web-cart-53976.appspot.com",
  messagingSenderId: "892985540558",
  appId: "1:892985540558:web:3548c4069ad24fe3dcb59f",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

if (import.meta.env.DEV) {
  const emulatorHost = window.location.hostname;

  connectFirestoreEmulator(db, emulatorHost, 8085);
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
}
