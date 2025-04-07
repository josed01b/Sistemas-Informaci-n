import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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


// Campos del documento
const userName = document.getElementById("nombre").value;
const Idnum = document.getElementById("identificacion").value;
const address = document.getElementById("direccion").value;
const age = document.getElementById("edad").value;
const email = document.getElementById("correo").value;
const tel = document.getElementById("telefono").value;
const prefeSelected = document.getElementById("preferencia").value;
const password = document.getElementById("contrasena").value;

const submit = document.getElementById("submit");

submit.addEventListener('click', function(event){
    event.preventDefault();

    const userName = document.getElementById("nombre").value;
    const Idnum = document.getElementById("identificacion").value;
    const address = document.getElementById("direccion").value;
    const age = document.getElementById("edad").value;
    const email = document.getElementById("correo").value;
    const tel = document.getElementById("telefono").value;
    const prefeSelected = document.getElementById("preferencia").value;
    const password = document.getElementById("contrasena").value;

    // crear usuario
    createUserWithEmailAndPassword(auth, email, password, userName, Idnum, address, age, tel, prefeSelected )
        .then((userCredential) => {
            const user = userCredential.user;
            setDoc(doc(db, "users", user.uid), {
                email: user.email,
                uid: user.uid,
                userName: userName,
                id: Idnum,
                address: address,
                age: age,
                tel:tel,
                prefeSelected: prefeSelected
            }).then(() => { 
                window.location.href = "/vistas/login.html"
            })

  })
  .catch((error) => {
    const errorMessage = error.message;
    alert(errorMessage);
  });

});
