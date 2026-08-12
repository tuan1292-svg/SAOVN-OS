// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js"; // Bổ sung dòng này

const firebaseConfig = {
  apiKey: "AIzaSyBXm7X-OPt1tIZH6ZyjO9jQalqCd9QqNyo",
  authDomain: "saovn-os.firebaseapp.com",
  projectId: "saovn-os",
  storageBucket: "saovn-os.firebasestorage.app",
  messagingSenderId: "1063877424668",
  appId: "1:1063877424668:web:ae51e77473c69d96f851d9",
  measurementId: "G-7T2NC73FR8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app); // Xuất thêm biến db để dùng