import { initializeApp } from "firebase/app";
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

if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
