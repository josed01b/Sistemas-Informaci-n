// Cambiar contaseña
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


