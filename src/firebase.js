import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC68EuzoV-HQh17pCJPNlhQ-oNtpg6wvrM",
  authDomain: "wavelength-database.firebaseapp.com",
  projectId: "wavelength-database",
  storageBucket: "wavelength-database.firebasestorage.app",
  messagingSenderId: "216124590630",
  appId: "1:216124590630:web:14470a52bfe61ace35b4e7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
