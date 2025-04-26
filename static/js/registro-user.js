import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPWy466EIvAfbe1v8sk5CCMfNqD5-Wjh0",
    authDomain: "smart-vet-9b0dd.firebaseapp.com",
    projectId: "smart-vet-9b0dd",
    storageBucket: "smart-vet-9b0dd.firebasestorage.app",
    messagingSenderId: "194441311375",
    appId: "1:194441311375:web:650df4bacd046f5e686cfa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.querySelector("form");

form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Obtener valores del formulario
    const userData = {
        nombre: document.getElementById("nombre").value,
        identificacion: document.getElementById("identificacion").value,
        direccion: document.getElementById("direccion").value,
        edad: document.getElementById("edad").value,
        email: document.getElementById("correo").value,
        telefono: document.getElementById("telefono").value,
        preferencia: document.getElementById("preferencia").value,
        password: document.getElementById("contrasena").value,
        role: "user" // Rol fijo para registro público
    };

    try {
        // 1. Crear usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            userData.email, 
            userData.password
        );
        const user = userCredential.user;

        // 2. Guardar información en Firestore
        await setDoc(doc(db, "users", user.uid), {
            nombre: userData.nombre,
            identificacion: userData.identificacion,
            direccion: userData.direccion,
            edad: parseInt(userData.edad),
            email: userData.email,
            telefono: userData.telefono,
            preferencia: userData.preferencia,
            role: userData.role,
            createdAt: new Date()
        });

        // 3. Redirigir a homepage
        alert("Registro exitoso!");
        window.location.href = "vistas/homepage.html";
    } catch (error) {
        console.error("Error en el registro:", error);
        alert(`Error: ${error.message}`);
    }
});