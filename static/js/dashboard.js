import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Función para verificar si el usuario es admin
async function isAdmin(userId) {
    const adminDoc = await getDoc(doc(db, "admins", userId));
    return adminDoc.exists();
}

// Función para cargar todas las mascotas
async function loadPetsData() {
    try {
        const querySnapshot = await getDocs(collection(db, "mascotas"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error cargando mascotas:", error);
        return [];
    }
}
