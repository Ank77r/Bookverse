// 1. Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // <--- NEW LINE

// 2. Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADvQv8QP5STZbxrRb3FLozPovUuSSgJ2A",
  authDomain: "bookverse-v01.firebaseapp.com",
  projectId: "bookverse-v01",
  storageBucket: "bookverse-v01.firebasestorage.app",
  messagingSenderId: "416182179254",
  appId: "1:416182179254:web:41af643eae9907bec35d17",
  measurementId: "G-EPHD9F4H7W"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Export the services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // <--- NEW LINE (The Database)