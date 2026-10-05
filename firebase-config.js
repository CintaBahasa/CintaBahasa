import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCcpi2Km9H7J-cmH7NKhIMly_dDIuEEeok",
  authDomain: "cintabahasa-6002d.firebaseapp.com",
  projectId: "cintabahasa-6002d",
  storageBucket: "cintabahasa-6002d.firebasestorage.app",
  messagingSenderId: "874719111870",
  appId: "1:874719111870:web:52b2452e112880b93e8cef",
  measurementId: "G-D9JRXSHF5R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
