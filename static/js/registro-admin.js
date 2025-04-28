import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signOut,
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
    storageBucket: "smart-vet-9b0dd.appspot.com",
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
    
    try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (!adminDoc.exists()) {
            alert("Acceso restringido a administradores");
            window.location.href = "../homepage.html";
            return false;
        }
        return true;
    } catch (error) {
        alert("Error de permisos: " + error.message);
        window.location.href = "../homepage.html";
        return false;
    }
}

// Registrar nuevo usuario/admin
async function registerUserByAdmin(userData, adminId) {
    try {
        // Verificar permisos del admin actual
        const adminDoc = await getDoc(doc(db, "admins", adminId));
        if (!adminDoc.exists()) {
            throw new Error("No tienes permisos de administrador");
        }

        // Validación especial para crear nuevos admins
        if (userData.role === "admin") {
            const confirm = window.confirm("¿Está seguro de crear un nuevo administrador?");
            if (!confirm) return { success: false, message: "Operación cancelada" };
            
            const currentAdminData = adminDoc.data();
            if (!currentAdminData.isSuperAdmin) {
                throw new Error("Solo superadmins pueden crear nuevos administradores");
            }
        }

        // Crear usuario con instancia temporal de auth
        const tempApp = initializeApp(firebaseConfig, "TempApp");
        const tempAuth = getAuth(tempApp);
        
        const userCredential = await createUserWithEmailAndPassword(
            tempAuth, 
            userData.email, 
            userData.password
        );
        const newUser = userCredential.user;

        // Preparar datos comunes
        const userDataForFirestore = {
            userName: userData.userName,
            id: userData.id,
            address: userData.address,
            age: parseInt(userData.age),
            email: userData.email,
            tel: userData.tel,
            preferencia: userData.preferencia,
            role: userData.role,
            createdBy: adminId,
            createdAt: new Date(),
            isSuperAdmin: false // Por defecto no es superadmin
        };

        // Guardar en colección según rol
        const collection = userData.role === "admin" ? "admins" : "users";
        await setDoc(doc(db, collection, newUser.uid), userDataForFirestore);

        // Cerrar sesión temporal
        await signOut(tempAuth);
        
        return { success: true, message: `${userData.role} registrado exitosamente` };
    } catch (error) {
        console.error("Error completo:", error);
        let errorMessage = error.message;
        
        if (error.code === "auth/email-already-in-use") {
            errorMessage = "El correo ya está registrado";
        } else if (error.code === "permission-denied") {
            errorMessage = "No tienes permisos para esta acción";
        }
        
        return { success: false, message: errorMessage };
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "vistas/login.html";
        } else if (!await verifyAdmin()) {
            return;
        }
    });

    // Manejar formulario
    const form = document.querySelector("form");
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!await verifyAdmin()) return;
        
        const userData = {
            userName: form.nombre.value,
            id: form.identificacion.value,
            address: form.direccion.value,
            age: form.edad.value,
            email: form.correo.value,
            tel: form.telefono.value,
            preferencia: form.preferencia.value,
            role: form.role.value,
            password: form.contrasena.value
        };

        const result = await registerUserByAdmin(userData, auth.currentUser.uid);
        alert(result.message);
        
        if (result.success) {
            form.reset();
        }
    });
});