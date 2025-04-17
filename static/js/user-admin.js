import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Verificar si el usuario actual es admin
async function verifyAdmin() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "/vistas/login.html";
    return false;
  }
  
  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  if (!adminDoc.exists()) {
    alert("Solo los administradores pueden registrar nuevos administradores");
    window.location.href = "/vistas/homepage.html";
    return false;
  }
  return true;
}

// Registrar nuevo usuario/admin
async function registerAdmin(event) {
  event.preventDefault();

  if (!await verifyAdmin()) return;

  const formData = {
    userName: document.getElementById("nombre").value,
    Idnum: document.getElementById("identificacion").value,
    address: document.getElementById("direccion").value,
    age: document.getElementById("edad").value,
    email: document.getElementById("correo").value,
    tel: document.getElementById("telefono").value,
    prefeSelected: document.getElementById("preferencia").value,
    password: document.getElementById("contrasena").value,
    role: document.getElementById("role").value // Aquí se toma la selección del rol
  };

  try {
    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      formData.email, 
      formData.password
    );

    const user = userCredential.user;
    const userData = {
      email: user.email,
      uid: user.uid,
      userName: formData.userName,
      id: formData.Idnum,
      address: formData.address,
      age: formData.age,
      tel: formData.tel,
      preferencia: formData.prefeSelected,
      role: formData.role,
      createdAt: new Date(),
      createdBy: auth.currentUser.uid // Quién lo creó
    };

    // Determinar en qué colección guardar
    const collectionName = formData.role === 'admin' ? 'admins' : 'users';
    
    // Guardar en la colección correspondiente
    await setDoc(doc(db, collectionName, user.uid), userData);

    alert(`${formData.role === 'admin' ? 'Administrador' : 'Usuario'} creado exitosamente`);
    window.location.href = "/vistas/admin/dashboard.html";

  } catch (error) {
    console.error("Error en registro:", error);
    alert(`Error al registrar: ${error.message}`);
  }
}

// Configuración inicial al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Verificar permisos primero
  verifyAdmin();
  
  // Configurar el evento de submit
  const submitBtn = document.getElementById("submit");
  if (submitBtn) {
    submitBtn.addEventListener('click', registerAdmin);
  }
});