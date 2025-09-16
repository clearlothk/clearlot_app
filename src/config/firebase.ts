// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2wNgiEcYAHbdz_6KAe-t52yvAlM6DLh4",
  authDomain: "clearlot-65916.firebaseapp.com",
  projectId: "clearlot-65916",
  storageBucket: "clearlot-65916.firebasestorage.app",
  messagingSenderId: "599899772543",
  appId: "1:599899772543:web:d2cbe4137180be0866914a",
  measurementId: "G-E2ZJZM4L53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure auth settings for email verification
auth.settings.appVerificationDisabledForTesting = false;

// Temporarily disable Analytics to avoid API key issues
// let analytics;
// if (typeof window !== 'undefined') {
//   analytics = getAnalytics(app);
// }

// export { analytics };
export default app; 