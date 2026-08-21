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

// Shared Experience Plane: every WEB page gets the same runtime shell.
if (typeof window !== 'undefined') {
  import('./core/experience-shell.js').catch(error => console.warn('Experience shell unavailable:', error?.code || error));
  import('./navigation.js').catch(error => console.warn('Shared navigation unavailable:', error));
  import('./header-badges.js').catch(error => console.warn('Header badges unavailable:', error?.code || error));
}
