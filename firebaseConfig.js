import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCGHJXXie87NgiOPgiYFys1kf2xUKuP90",
  authDomain: "meal-logger-35651.firebaseapp.com",
  projectId: "meal-logger-35651",
  storageBucket: "meal-logger-35651.firebasestorage.app",
  messagingSenderId: "777334432396",
  appId: "1:777334432396:web:cfa0c86962d5d5cb0a51a9",
  measurementId: "G-GS9HN178DL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
