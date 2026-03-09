import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

function buildSavedPlaceDocId(uid, place) {
  if (place.placeId) {
    return `${uid}_${place.placeId}`;
  }

  const safeName = (place.name || "place").replace(/\s+/g, "_").toLowerCase();
  return `${uid}_${safeName}_${place.lat}_${place.lng}`;
}

export async function savePlace(place) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No logged in user");

  const docId = buildSavedPlaceDocId(uid, place);
  const ref = doc(db, "savedPlaces", docId);

  const payload = {
    uid,
    placeId: place.placeId || "",
    name: place.name,
    address: place.address || "",
    category: place.category || "place",
    lat: place.lat,
    lng: place.lng,
    photoUrl: place.photoUrl || "",
    createdAt: new Date().toISOString(),
  };

  console.log("Saving place to Firestore:", payload);

  await setDoc(ref, payload);

  console.log("Saved successfully with doc id:", docId);

  return docId;
}

export async function isPlaceSaved(place) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No logged in user");

  const docId = buildSavedPlaceDocId(uid, place);
  const ref = doc(db, "savedPlaces", docId);
  const snapshot = await getDoc(ref);

  return snapshot.exists();
}

export async function getSavedPlaces() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No logged in user");

  const q = query(collection(db, "savedPlaces"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((placeDoc) => ({
    id: placeDoc.id,
    ...placeDoc.data(),
  }));
}

export async function removeSavedPlace(docId) {
  await deleteDoc(doc(db, "savedPlaces", docId));
}
