import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

/* Cargar sidebar*/
fetch("/vistas/plantilla/sidebar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("sidebar-container").innerHTML = data;

    //Mostrar el sidebar
    const showSidebar = (toggleId, sidebarId, headerId, mainId) => {
      const toggle = document.getElementById(toggleId),
        sidebar = document.getElementById(sidebarId),
        header = document.getElementById(headerId),
        main = document.getElementById(mainId);

      if (toggle && sidebar && header && main) {
        toggle.addEventListener("click", () => {
          /* Mostrar sidebar */
          sidebar.classList.toggle("show-sidebar");
          /* Agregar padding al header */
          header.classList.toggle("left-pd");
          /* Agregar padding al main */
          main.classList.toggle("left-pd");
        });
      }
    };
    showSidebar("header-toggle", "sidebar", "header", "main");

    //Activar los links o hacer que funcione
    const sidebarLink = document.querySelectorAll(".sidebar__list a");

    function linkColor() {
      sidebarLink.forEach((l) => l.classList.remove("active-link"));
      this.classList.add("active-link");
    }

    sidebarLink.forEach((l) => l.addEventListener("click", linkColor));

    //Activar el modo oscuro
    const themeButton = document.getElementById("theme");
    const darkTheme = "dark-theme";
    const iconTheme = "ri-sun-line";

    // Previamente seleccionado (si el usuario lo selecciono)
    const selectedTheme = localStorage.getItem("selected-theme");
    const selectedIcon = localStorage.getItem("selected-icon");

    // Obtenemos el tema actual de la interfaz (o del usuario) validando la clase theme
    const getCurrentTheme = () =>
      document.body.classList.contains(darkTheme) ? "dark" : "light";
    const getCurrentIcon = () =>
      themeButton.classList.contains(iconTheme)
        ? "ri-moon-clear-line"
        : "ri-sun-line";

    // Validamos si el fue seleccionado previamente
    if (selectedTheme) {
      // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
      document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
        darkTheme
      );
      themeButton.classList[
        selectedIcon === "ri-moon-clear-line" ? "add" : "remove"
      ](iconTheme);
    }

    // Acticar / desactivar el tema con el boton
    themeButton.addEventListener("click", () => {
      // Agregar o remover el icono del tema
      document.body.classList.toggle(darkTheme);
      themeButton.classList.toggle(iconTheme);
      // Guardar las selecciones hechas poir el usuario del momento
      localStorage.setItem("selected-theme", getCurrentTheme());
      localStorage.setItem("selected-icon", getCurrentIcon());
    });

    // Manejo de autenticación
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Primero verifica en la colección de admins
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        
        if (adminDoc.exists()) {
          // Es administrador
          const adminData = adminDoc.data();
          document.getElementById("nombre").textContent = adminData.userName;
          document.getElementById("correo").textContent = adminData.email;
          document.getElementById("sidebar").classList.add("show-admin");
        } else {
          // Si no es admin, verifica en users
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById("nombre").textContent = userData.userName;
            document.getElementById("correo").textContent = userData.email;
            document.getElementById("sidebar").classList.add("show-user");
          }
        }
      } else {
        window.location.href = "/vistas/login.html";
      }
    });

    // Logout
    document.getElementById("logout").addEventListener("click", () => {
      signOut(auth).then(() => (window.location.href = "/vistas/login.html"));
    });
  });
