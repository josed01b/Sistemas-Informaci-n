import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
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
function verifyAdmin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/vistas/login.html";
      return;
    }

    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      alert("Solo los administradores pueden registrar nuevos administradores");
      window.location.href = "/vistas/homepage.html";
      return;
    }

    // Usuario verificado como admin
    if (callback) callback();
  });
}

// Registrar nuevo usuario/admin
async function registerAdmin(event) {
  event.preventDefault();

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

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {  // Usa async ya que verifyAdmin puede ser asíncrona
    if (user) {
      try {
        // Verifica si es administrador
        verifyAdmin();

        const form = document.querySelector('form'); // Seleccionar el formulario
        if (form) {
          form.addEventListener('submit', registerAdmin); // Escuchar el evento submit
        }
      } catch (error) {
        console.error("No se pudo verificar el admin: ", error);
        window.location.href = "/vistas/login.html";  // Redirige si el usuario no es admin o algo falla
      }
    } else {
      // Redirige si no hay usuario
      window.location.href = "/vistas/login.html";
    }
  });
});
