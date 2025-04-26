import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPWy466EIvAfbe1v8sk5CCMfNqD5-Wjh0",
    authDomain: "smart-vet-9b0dd.firebaseapp.com",
    projectId: "smart-vet-9b0dd",
    storageBucket: "smart-vet-9b0dd.firebasestorage.app",
    messagingSenderId: "194441311375",
    appId: "1:194441311375:web:650df4bacd046f5e686cfa"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Verificar estado de administrador
async function verifyAdmin() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = "login.html";
        return false;
    }
    
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
        alert("Acceso restringido a administradores");
        window.location.href = "homepage.html";
        return false;
    }
    return true;
}

// Registrar nuevo usuario
async function registerUserByAdmin(userData, adminId) {
    try {
        // Validar rol admin
        if (userData.role === "admin") {
            const confirm = window.confirm("¿Está seguro de crear un nuevo administrador?");
            if (!confirm) return { success: false, message: "Operación cancelada" };
        }

        // Crear usuario
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            userData.email, 
            userData.password
        );
        const newUser = userCredential.user;

        // Guardar datos en Firestore
        await setDoc(doc(db, "users", newUser.uid), {
            ...userData,
            edad: parseInt(userData.edad),
            createdBy: adminId,
            createdAt: new Date()
        });

        // Si es admin, agregar a colección de admins
        if (userData.role === "admin") {
            await setDoc(doc(db, "admins", newUser.uid), {
                email: userData.email,
                addedBy: adminId,
                addedAt: new Date()
            });
        }

        return { success: true, message: "Usuario registrado exitosamente" };
    } catch (error) {
        console.error("Error al registrar:", error);
        return { success: false, message: error.message };
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación y privilegios
    onAuthStateChanged(auth, async (user) => {
        if (!await verifyAdmin()) return;
    });

    // Manejar envío de formulario
    const form = document.querySelector("form");
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!await verifyAdmin()) return;
        
        const userData = {
            nombre: form.nombre.value,
            identificacion: form.identificacion.value,
            direccion: form.direccion.value,
            edad: form.edad.value,
            email: form.correo.value,
            telefono: form.telefono.value,
            preferencia: form.preferencia.value,
            password: form.contrasena.value,
            role: form.role.value
        };

        const result = await registerUserByAdmin(userData, auth.currentUser.uid);
        alert(result.message);
        
        if (result.success) {
            form.reset();
        }
    });
});