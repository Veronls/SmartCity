import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClz6uZSFCGeRYFNeovU5o_tkpqR8lnok0",
  authDomain: "smartcity-b0f2c.firebaseapp.com",
  projectId: "smartcity-b0f2c",
  storageBucket: "smartcity-b0f2c.firebasestorage.app",
  messagingSenderId: "1047634177975",
  appId: "1:1047634177975:web:1f285308bc8b162a950232",
  measurementId: "G-NHBR51VZFM",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
