// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBURGK6ORVJoNaHewFSprImB1uw-N8hcWw",
  authDomain: "teelt-8fda1.firebaseapp.com",
  projectId: "teelt-8fda1",
  storageBucket: "teelt-8fda1.firebasestorage.app",
  messagingSenderId: "73676439998",
  appId: "1:73676439998:web:5806cb6611d66abd2c39ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Temporarily disable Analytics to avoid API key issues
// let analytics;
// if (typeof window !== 'undefined') {
//   analytics = getAnalytics(app);
// }

// export { analytics };
export default app; 