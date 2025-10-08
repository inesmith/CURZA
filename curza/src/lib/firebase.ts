// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbQCczVN9NP1XPtWjb6u1aeOjrlIVZIvY",
  authDomain: "curza-d607e.firebaseapp.com",
  projectId: "curza-d607e",
  storageBucket: "curza-d607e.firebasestorage.app",
  messagingSenderId: "1052480298705",
  appId: "1:1052480298705:web:947cf2267208bda8e32ff0",
  measurementId: "G-WL3RX44BEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);