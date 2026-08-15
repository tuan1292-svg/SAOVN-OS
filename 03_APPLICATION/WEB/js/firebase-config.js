// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBXm7X-OPt1tIZH6ZyjO9jQalqCd9QqNyo",
  authDomain: "saovn-os.firebaseapp.com",
  projectId: "saovn-os",
  storageBucket: "saovn-os.firebasestorage.app",
  messagingSenderId: "1063877424668",
  appId: "1:1063877424668:web:ae51e77473c69d96f851d9",
  measurementId: "G-7T2NC73FR8"
};

export const app = initializeApp(firebaseConfig);
getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Load the global header counters after Firebase exports are initialized.
if (typeof window !== 'undefined') import('./header-badges.js').catch(error => console.warn('Header badges unavailable:', error?.code || error));
