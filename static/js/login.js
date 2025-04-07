import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth,signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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
  
  const login = document.getElementById("login");

  login.addEventListener('click', function(event) {
    event.preventDefault();

    const email = document.getElementById("correo").value;
    const password = document.getElementById("contrasena").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
        
        const user = userCredential.user;

        localStorage.setItem("user", JSON.stringify({ uid: user.uid,
            email: user.email
        }));

        window.location.href = "/vistas/homepage.html"
    
    })
    .catch((error) => {
        const errorMessage = error.message;
        alert(`Inicio Sesion fallido: ${errorMessage}`)
    });

  })


  // recuperar contaseña
  const reset = document.getElementById("recuperar");

  reset.addEventListener("click", function(event){
    event.preventDefault();

    const email = document.getElementById("correo").value;
    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert("Hemos enviado un link a tu correo")
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(`Digite solo el correo`)
            console.log(errorMessage)
            console.log(errorCode)
        })
  })