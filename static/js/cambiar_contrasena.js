import {
  auth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "/static/js/firebase-config.js";

const requirements = {
  length: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*]/,
};

document.getElementById("newPassword").addEventListener("input", function (e) {
  const password = e.target.value;
  let strength = 0;

  // Validar cada requisito
  Object.keys(requirements).forEach((key) => {
    const requirement = requirements[key];
    const li = document.getElementById(key);

    if (typeof requirement === "number") {
      // Longitud
      const isValid = password.length >= requirement;
      li.classList.toggle("valid", isValid);
      if (isValid) strength++;
    } else {
      // Regex
      const isValid = requirement.test(password);
      li.classList.toggle("valid", isValid);
      if (isValid) strength++;
    }
  });

  // Actualizar barra de fortaleza
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text span");
  const submitBtn = document.getElementById("cambiar");

  const width = (strength / 5) * 100;
  strengthBar.style.width = `${width}%`;

  if (strength < 2) {
    strengthBar.style.background = "var(--danger)";
    strengthText.textContent = "Débil";
    strengthText.style.color = "var(--danger)";
    submitBtn.disabled = true;
  } else if (strength < 4) {
    strengthBar.style.background = "var(--warning)";
    strengthText.textContent = "Moderada";
    strengthText.style.color = "var(--warning)";
    submitBtn.disabled = true;
  } else {
    strengthBar.style.background = "var(--success)";
    strengthText.textContent = "Fuerte";
    strengthText.style.color = "var(--success)";
    submitBtn.disabled = false;
  }
});

document
  .getElementById("passwordForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validaciones
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas nuevas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const user = auth.currentUser;

    try {
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Actualizar contraseña
      await updatePassword(user, newPassword);

      alert("Contraseña cambiada exitosamente");
      // Limpiar formulario
      document.getElementById("passwordForm").reset();
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);

      if (error.code === "auth/wrong-password") {
        alert("La contraseña actual es incorrecta");
      } else {
        alert(`Error al cambiar contraseña: ${error.message}`);
      }
    }
  });
