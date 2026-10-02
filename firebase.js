import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTboZL3nk8ck3615IZxBXk-2r5eRXJZ1Y",
  authDomain: "quiznova-cdca7.firebaseapp.com",
  databaseURL: "https://quiznova-cdca7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quiznova-cdca7",
  storageBucket: "quiznova-cdca7.firebasestorage.app",
  messagingSenderId: "421051769073",
  appId: "1:421051769073:web:516dd4c1ef4314c48c0950",
  measurementId: "G-NK5X86MVSY"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}
