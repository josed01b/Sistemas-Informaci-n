// Configuración compartida de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPWy466EIvAfbe1v8sk5CCMfNqD5-Wjh0",
    authDomain: "smart-vet-9b0dd.firebaseapp.com",
    projectId: "smart-vet-9b0dd",
    storageBucket: "smart-vet-9b0dd.firebasestorage.app",
    messagingSenderId: "194441311375",
    appId: "1:194441311375:web:650df4bacd046f5e686cfa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);