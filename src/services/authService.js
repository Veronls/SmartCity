import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function registerUser(name, email, password) {
  const cleanedEmail = email.trim();

  if (!isValidEmail(cleanedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    cleanedEmail,
    password,
  );
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email: cleanedEmail,
    createdAt: new Date().toISOString(),
  });

  return user;
}

export async function loginUser(email, password) {
  const cleanedEmail = email.trim();

  if (!isValidEmail(cleanedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    cleanedEmail,
    password,
  );
  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}
