console.log("El archivo JavaScript se está cargando");
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

//funcion para listar las mascotas
async function listarMascotasUsuario(userId) {
  try {
    // Verificar si el usuario es admin
    const adminDoc = await getDoc(doc(db, "admins", userId));

    let q;
    if (adminDoc.exists()) {
      // Si es admin, puede ver todas las mascotas
      q = collection(db, "mascotas");
    } else {
      // Si no es admin, solo sus mascotas
      q = query(collection(db, "mascotas"), where("ownerId", "==", userId));
    }

    const querySnapshot = await getDocs(q);
    const mascotas = [];

    querySnapshot.forEach((doc) => {
      mascotas.push({ id: doc.id, ...doc.data() });
    });

    return mascotas;
  } catch (error) {
    console.error("Error al listar mascotas:", error);
    throw error;
  }
}

// Función para recolectar datos de vacunas
function getVaccineData() {
  const vacunas = [];

  // Selecciona todos los items de vacuna
  document.querySelectorAll(".vaccine-item").forEach((item) => {
    const checkbox = item.querySelector(".vaccine-check");
    const nombre = checkbox.getAttribute("name").replace("vacuna_", "");

    if (checkbox.checked) {
      const estado = item.querySelector(".vaccine-status").value;
      const fecha = item.querySelector(".vaccine-date").value;

      vacunas.push({
        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
        estado: estado,
        fecha: fecha || null,
      });
    }
  });

  return vacunas;
}

// Función para manejar la interacción de las vacunas
function setupVaccineInteraction() {
  // Mostrar/ocultar detalles al hacer clic en el checkbox
  document.querySelectorAll(".vaccine-check").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const details =
        this.closest(".vaccine-item").querySelector(".vaccine-details");
      if (this.checked) {
        details.style.display = "block";
      } else {
        details.style.display = "none";
      }
    });
  });

  // Inicializar visibilidad según estado del checkbox
  document.querySelectorAll(".vaccine-check").forEach((checkbox) => {
    const details = checkbox
      .closest(".vaccine-item")
      .querySelector(".vaccine-details");
    details.style.display = checkbox.checked ? "block" : "none";
  });
}

function setupDetallesButtons() {
  // Usamos event delegation para manejar clicks en elementos dinámicos
  document
    .getElementById("contenedor-cards")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("btn-ver-mas")) {
        const card = e.target.closest(".card-mascota");
        const detalles = card.querySelector(".detalles-adicionales");
        const btnTexto = e.target;

        // Alternar visibilidad con animación
        if (detalles.style.display === "none" || !detalles.style.display) {
          detalles.style.display = "block";
          btnTexto.textContent = "Ver menos detalles ↑";
          card.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        } else {
          detalles.style.display = "none";
          btnTexto.textContent = "Ver más detalles ↓";
          card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        }
      }
    });
}

function formatAllergiesForDisplay(allergiesData) {
    if (!allergiesData) return "Ninguna registrada";
    
    try {
        const allergies = typeof allergiesData === 'string' ? JSON.parse(allergiesData) : allergiesData;
        
        if (allergies.length === 0) return "Ninguna registrada";
        
        // Mostrar solo los nombres de las alergias en la vista resumida
        return allergies.map(a => a.name).join(', ');
    } catch (e) {
      console.log(e);
      // Si no es JSON válido, mostrar el texto directamente (para compatibilidad con versiones anteriores)
      return allergiesData.length > 50 ? allergiesData.substring(0, 50) + '...' : allergiesData;
    }
}

function formatAllergiesDetails(allergiesData) {
    if (!allergiesData) return "Ninguna registrada";
    
    try {
        const allergies = typeof allergiesData === 'string' ? JSON.parse(allergiesData) : allergiesData;
        
        if (allergies.length === 0) return "Ninguna registrada";
        
        return `
            <ul class="allergies-detail-list">
                ${allergies.map(a => `
                    <li>
                        <strong>${a.name}</strong> (${a.severity})
                        <div><small><strong>Síntomas:</strong> ${a.symptoms}</small></div>
                        ${a.recommendations ? `<div><small><strong>Recomendaciones:</strong> ${a.recommendations}</small></div>` : ''}
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (e) {
      console.log(e);
      return allergiesData; // Mostrar el texto directamente si no es JSON
    }
}

// Función para calcular la próxima consulta
function calcularProximaConsulta(ultimaConsulta) {
  if (!ultimaConsulta) return "";
 
  const partes = ultimaConsulta.split("-");
  const fechaUltima = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  const hoy = new Date();
 
  const proximaConsulta = new Date(fechaUltima);
  proximaConsulta.setFullYear(fechaUltima.getFullYear() + 1);
 
  let mensaje = "";
  if (proximaConsulta < hoy) {
      mensaje = `<span style="color: red; font-weight: bold;">¡Consulta pendiente! Se recomienda agendar una cita.</span>`;
  } else {
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      mensaje = `<span style="color: green;">Próxima consulta:  ${proximaConsulta.toLocaleDateString('es-ES', opciones)}</span>`;
  }
  return mensaje;
}

// Función para mostrar mascotas en cards
function mostrarMascotasEnCards(mascotas) {
  const contenedor = document.getElementById("contenedor-cards");
  contenedor.innerHTML = "";

  mascotas.forEach((mascota) => {
    const card = document.createElement("div");
    card.className = "card-mascota";

    // Formatear las vacunas para mostrar
    let vacunasTexto = "Ninguna";
    if (mascota.vacunas && mascota.vacunas.length > 0) {
      vacunasTexto = mascota.vacunas
        .map((v) => `${v.nombre} (${v.estado})`)
        .join(", ");
    }

    // Determinar icono según especie
    const iconoEspecie =
      mascota.especie.toLowerCase() === "perro" ? "fa-dog" : "fa-cat";

    card.innerHTML = `
          <div class="card-header">
            <h3>${mascota.nombre}</h3>
            <i class="fas ${iconoEspecie} especie-icon"></i>
          </div>
          <div class="card-body">
            <div class="dato-mascota">
                <strong>Especie:</strong>
                <span>${mascota.especie}</span>
            </div>
            <div class="dato-mascota">
                <strong>Raza:</strong>
                <span>${mascota.raza || "No especificado"}</span>
            </div>
            <div class="dato-mascota">
                <strong>Edad:</strong>
                <span>${mascota.edad || "No especificado"}</span>
            </div>
            <div class="dato-mascota">
                <strong>Peso:</strong>
                <span>${
                  mascota.peso ? mascota.peso + " kg" : "No especificado"
                }</span>
            </div>
            <div class="dato-mascota">
              <strong>Vacunas:</strong>
              <span>${vacunasTexto}</span>
            </div>
            <div class="dato-mascota">
              <strong>Alergias:</strong>
              <span>${formatAllergiesForDisplay(mascota.alergias)}</span>
            </div>
            
            <button class="btn-ver-mas">Ver más detalles ↓</button>
            
            <div class="detalles-adicionales">
                  <div class="dato-mascota">
                      <strong>Color:</strong>
                      <span>${mascota.color || "No especificado"}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Alimentación:</strong>
                      <span>${mascota.alimentacion || "No especificado"}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Comportamiento:</strong>
                      <span>${
                        mascota.comportamiento || "No especificado"
                      }</span>
                  </div>
                  <div class="dato-mascota">
                    <strong>Alergias:</strong>
                    <div class="allergies-detail">${formatAllergiesDetails(mascota.alergias)}</div>
                  </div>
                  <div class="dato-mascota">
                      <strong>Última consulta:</strong>
                      <span>${mascota.ultimaConsulta || "No registrada"}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Proxima Consulta: </strong>
                      <span>${calcularProximaConsulta(mascota.ultimaConsulta) || "No registrada"}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Veterinario:</strong>
                      <span>${mascota.veterinario || "No asignado"}</span>
                  </div>
                  ${
                    mascota.historial
                      ? `
                  <div class="dato-mascota">
                      <strong>Historial médico:</strong>
                      <span>${mascota.historial}</span>
                  </div>`
                      : ""
                  }
                  ${
                    mascota.observaciones
                      ? `
                  <div class="dato-mascota">
                      <strong>Observaciones:</strong>
                      <span>${mascota.observaciones}</span>
                  </div>`
                      : ""
                  }
              </div>
          </div>
      <div class="card-footer">
          <button class="btn-mascota btn-editar" data-id="${
            mascota.id
          }">Editar</button>
          <button class="btn-mascota btn-eliminar" data-id="${
            mascota.id
          }">Eliminar</button>
      </div>
      `;

    contenedor.appendChild(card);
  });

  document.querySelectorAll('.btn-ver-mas').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Encontrar el contenedor de detalles específico para esta card
      const detalles = this.nextElementSibling;
      
      // Cerrar todos los demás detalles primero
      document.querySelectorAll('.detalles-adicionales').forEach(d => {
        if (d !== detalles) {
          d.classList.remove('active');
          d.previousElementSibling.textContent = 'Ver más detalles ↓';
        }
      });
      
      // Alternar solo los detalles de esta card
      detalles.classList.toggle('active');
      
      // Cambiar el texto del botón
      this.textContent = detalles.classList.contains('active') ? 
        'Ocultar detalles ↑' : 'Ver más detalles ↓';
    });
  });

  EventListenersAcciones();
}

// Función para eliminar mascota
async function eliminarMascota(id) {
  try {
    await deleteDoc(doc(db, "mascotas", id));
    console.log("Mascota eliminada correctamente");
    alert("Mascota eliminada con éxito");
  } catch (error) {
    console.error("Error al eliminar mascota:", error);
    alert("Error al eliminar mascota");
  }
}

// Función para obtener datos de una mascota (para editar)
async function obtenerMascotaPorId(id) {
  try {
    const docRef = doc(db, "mascotas", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No se encontró la mascota");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener mascota:", error);
    return null;
  }
}

async function guardarCambiosMascota(idMascota, userId) {
  try {

    const alergiasJsonElement = document.getElementById('alergias_json');
    const alergiasJson = alergiasJsonElement ? alergiasJsonElement.value : '[]';
    
    const mascotaData = {
      nombre: document.getElementById("nombre").value,
      especie: document.getElementById("especie").value,
      raza: document.getElementById("raza").value,
      color: document.getElementById("color").value,
      peso: parseFloat(document.getElementById("peso").value),
      edad: document.getElementById("edad").value,
      alimentacion: document.getElementById("alimentacion").value,
      comportamiento: document.getElementById("comportamiento").value,
      medicamentos: document.getElementById("medicamentos").value,
      vacunas: vacunasSeleccionadas,
      alergias: alergiasJson,
      historial: document.getElementById("historial").value,
      ultimaConsulta: document.getElementById("ultima_consulta").value,
      seguro: document.querySelector('input[name="seguro"]:checked').value,
      veterinario: document.getElementById("veterinario").value,
      observaciones: document.getElementById("observaciones").value,
      ownerId: userId,
      fechaActualizacion: new Date()
    };

    // Validación básica
    if (!mascotaData.nombre || !mascotaData.especie) {
      throw new Error("Nombre y especie son campos obligatorios");
    }

    // Actualizar el documento existente
    await updateDoc(doc(db, "mascotas", idMascota), mascotaData);
    
    alert("Mascota actualizada correctamente");
    window.location.href = "/vistas/mascotas/listarmascotas.html";
  } catch (error) {
    console.error("Error al actualizar mascota:", error);
    alert("Error al actualizar mascota: " + error.message);
  }
}

// 1. Función para manejar la edición de mascotas
async function manejarEdicionMascota() {
  if (!window.location.pathname.includes('/vistas/mascotas/modificarmascota.html')) return;

  console.log("Iniciando manejo de edición...");

  if (document.getElementById('alergias_json')) {
    document.getElementById('alergias_json').value = mascota.alergias || '[]';
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const idMascota = urlParams.get('id');
  
  if (!idMascota) {
    console.error("No se encontró ID en la URL");
    alert("No se especificó una mascota para editar");
    window.location.href = "/vistas/mascotas/listarmascotas.html";
    return;
  }

  console.log("ID de mascota a editar:", idMascota);

  try {
    const user = auth.currentUser;
    if (!user) {
      window.location.href = "/vistas/login.html";
      return;
    }

    const mascota = await obtenerMascotaPorId(idMascota);
    console.log("Datos obtenidos de Firestore:", mascota);
    
    if (!mascota) {
      alert("No se encontró la mascota");
      window.location.href = "/vistas/mascotas/listarmascotas.html";
      return;
    }

    if (mascota.ownerId !== user.uid) {
      alert("No tienes permiso para editar esta mascota");
      window.location.href = "/vistas/mascotas/listarmascotas.html";
      return;
    }

    // Llenar campos básicos
    const campos = [
      'nombre', 'especie', 'raza', 'color', 'peso', 'edad',
      'alimentacion', 'comportamiento', 'medicamentos',
      'alergias', 'historial', 'ultima_consulta', 'veterinario', 'observaciones'
    ];
    
    campos.forEach(campo => {
      const elemento = document.getElementById(campo);
      if (elemento) {
        elemento.value = mascota[campo] || '';
      } else {
        console.warn(`Elemento no encontrado: ${campo}`);
      }
    });

    if (mascota.alergias) {
    try {
        const alergiasData = typeof mascota.alergias === 'string' 
            ? JSON.parse(mascota.alergias) 
            : mascota.alergias;
        
        document.getElementById('alergias_json').value = JSON.stringify(alergiasData);
        
        // Si existe el textarea antiguo, ocultarlo
        if (document.getElementById('alergias')) {
            document.getElementById('alergias').style.display = 'none';
        }
    } catch (e) {
        console.error('Error parsing allergies:', e);
        // Si hay error, mantener el sistema antiguo
        if (document.getElementById('alergias') && mascota.alergias) {
            document.getElementById('alergias').value = typeof mascota.alergias === 'string' 
                ? mascota.alergias 
                : 'Ver detalles en alergias específicas';
        }
    }
}

    // Llenar seguro
    const seguroValue = mascota.seguro || 'no';
    const seguroElement = document.querySelector(`input[name="seguro"][value="${seguroValue}"]`);
    if (seguroElement) {
      seguroElement.checked = true;
    }

    // Llenar vacunas
    const vacunas = mascota.vacunas || [];
    document.querySelectorAll('.vaccine-item').forEach(item => {
      const checkbox = item.querySelector('.vaccine-check');
      const vaccineName = checkbox.getAttribute('name').replace('vacuna_', '');
      
      const vaccineData = Array.isArray(vacunas) 
        ? vacunas.find(v => v.nombre && v.nombre.toLowerCase() === vaccineName.toLowerCase())
        : null;
      
      if (vaccineData) {
        checkbox.checked = true;
        const status = item.querySelector('.vaccine-status');
        const date = item.querySelector('.vaccine-date');
        
        if (status) status.value = vaccineData.estado || '';
        if (date) date.value = vaccineData.fecha || '';
        
        const details = item.querySelector('.vaccine-details');
        if (details) details.style.display = 'block';
      }
    });

    

    // Configurar submit del formulario
    const form = document.getElementById('form-mascota');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCambiosMascota(idMascota, user.uid);
      });
    }

  } catch (error) {
    console.error("Error en manejarEdicionMascota:", error);
    alert("Error al cargar los datos de la mascota");
  }
}

// Modifica EventListenersAcciones para redirigir correctamente
function EventListenersAcciones() {
  // Eliminar mascota (mantén este código igual)
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const idMascota = e.target.dataset.id;
      if (confirm("¿Estás seguro de eliminar esta mascota?")) {
        await eliminarMascota(idMascota);
        const user = auth.currentUser;
        if (user) {
          const mascotas = await listarMascotasUsuario(user.uid);
          mostrarMascotasEnCards(mascotas);
        }
      }
    });
  });

  // Editar mascota (Para usar manejarEdicionMascota)
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idMascota = e.target.dataset.id;
      localStorage.setItem("mascotaEditarId", idMascota);
      window.location.href = `/vistas/mascotas/modificarmascota.html?id=${idMascota}`;
    });
  });
}

// Modifica el event listener DOMContentLoaded para incluir manejarEdicionMascota
document.addEventListener("DOMContentLoaded", async () => {

  setupVaccineInteraction();

  onAuthStateChanged(auth, async (user) => {
    setupVaccineInteraction();
    setupAllergiesSystem();

    if (!user) {
      window.location.href = "/vistas/login.html";
      return;
    }

    await manejarEdicionMascota();

    // Listar mascotas si estamos en esa página
    if (document.getElementById("contenedor-cards")) {
      const mascotas = await listarMascotasUsuario(user.uid);
      mostrarMascotasEnCards(mascotas);
      setupDetallesButtons();
    }

    // Si estamos en la página de registro
    if (document.getElementById("submit")) {
      const submit = document.getElementById("submit");
      submit.addEventListener("click", async function (event) {
        event.preventDefault();

        try {
          const user = auth.currentUser;
          if (!user) throw new Error("Usuario no autenticado");

          // Obtener valores del formulario
          const mascotaData = {
            nombre: document.getElementById("nombre").value,
            especie: document.getElementById("especie").value,
            raza: document.getElementById("raza").value,
            color: document.getElementById("color").value,
            peso: parseFloat(document.getElementById("peso").value),
            edad: document.getElementById("edad").value,
            alimentacion: document.getElementById("alimentacion").value,
            comportamiento: document.getElementById("comportamiento").value,
            medicamentos: document.getElementById("medicamentos").value,
            vacunas: getVaccineData(), // Cambiamos a array de vacunas
            fechaUltimaVacuna:
              document.getElementById("fecha_ultima_vacuna").value || null,
            alergias: document.getElementById('alergias_json').value,
            historial: document.getElementById("historial").value,
            ultimaConsulta: document.getElementById("ultima_consulta").value,
            seguro:
              document.querySelector('input[name="seguro"]:checked')?.value ||
              "no",
            veterinario: document.getElementById("veterinario").value,
            observaciones: document.getElementById("observaciones").value,
            ownerId: user.uid,
            fechaCreacion: new Date(),
          };

          // Validación básica
          if (!mascotaData.nombre || !mascotaData.especie) {
            throw new Error("Nombre y especie son campos obligatorios");
          }

          // Guardar en Firestore
          const docRef = await addDoc(collection(db, "mascotas"), mascotaData);
          console.log("Mascota creada con ID:", docRef.id); //  Ahora se usa docRef

          alert("Mascota registrada exitosamente!");
          window.location.href = "/vistas/mascotas/listarmascotas.html";
        } catch (error) {
          console.error("Error al agregar mascota:", error);
          alert("Error: " + error.message);
        }
      });
    }

    // Manejar la edición si estamos en esa página
    manejarEdicionMascota();
    if (document.getElementById("btn-actualizar")) {
      // Lógica para ACTUALIZAR mascotas (formulario de edición)
      const btnActualizar = document.getElementById("btn-actualizar");
      btnActualizar.addEventListener("click", async function (event) {
        event.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const idMascota = urlParams.get('id');
        if (idMascota && auth.currentUser) {
          await guardarCambiosMascota(idMascota, auth.currentUser.uid);
        }
      });
    }

  });
});

// Sistema de gestión de alergias
function setupAllergiesSystem() {
    // 1. Obtener elementos con verificación
    const getElement = (id) => {
        const el = document.getElementById(id);
        if (!el) console.error(`Elemento no encontrado: ${id}`);
        return el;
    };

    const elements = {
        container: getElement('allergiesContainer'),
        addBtn: getElement('addAllergyBtn'),
        modal: getElement('allergyModal'),
        saveBtn: getElement('saveAllergyBtn'),
        cancelBtn: getElement('cancelAllergyBtn'),
        title: getElement('modalTitle'), // Asegúrate que este ID existe en tu HTML
        nameInput: getElement('allergyName'),
        severitySelect: getElement('allergySeverity'),
        symptomsInput: getElement('allergySymptoms'),
        recomInput: getElement('allergyRecom')
    };

    // 2. Verificar que los elementos esenciales existen
    if (!elements.container || !elements.addBtn || !elements.modal || 
        !elements.saveBtn || !elements.cancelBtn || !elements.title) {
        console.error('Elementos esenciales del modal no encontrados');
        return;
    }

        // Variables de estado
        let allergies = [];
        let currentEditIndex = -1;

    // Función para añadir alergia (corregida)
    elements.addBtn.addEventListener('click', () => {
        if (!elements.title) {
            console.error('Elemento modalTitle no encontrado');
            return;
        }

        currentEditIndex = -1;
        elements.title.textContent = 'Añadir Alergia';
        elements.nameInput.value = '';
        elements.severitySelect.value = 'leve';
        elements.symptomsInput.value = '';
        elements.recomInput.value = '';
        elements.modal.style.display = 'flex';
    });

   
    elements.saveBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir el comportamiento por defecto
        
        // Validar manualmente
        if (!elements.nameInput.value || !elements.severitySelect.value) {
            alert('Por favor complete todos los campos requeridos');
        }});

        // 4. Inicializar datos
        const initAllergies = () => {
            const jsonInput = document.getElementById('alergias_json');
            if (jsonInput && jsonInput.value) {
                try {
                    allergies = JSON.parse(jsonInput.value);
                } catch (e) {
                    console.error('Error parsing allergies:', e);
                    allergies = [];
                }
            } 
        };

        // 5. Renderizar alergias
        const renderAllergies = () => {
            // Limpiar contenedor de forma segura
            elements.container.innerHTML = '';
            
            if (allergies.length === 0) {
                elements.container.innerHTML = `
                    <div class="allergy-item indeterminada">
                        <div class="allergy-header">
                            <span class="allergy-name">Alergias desconocidas</span>
                            <span class="severity-badge">Indeterminada</span>
                        </div>
                        <div class="allergy-details">
                            <p><strong>Síntomas:</strong> No se han identificado alergias aún</p>
                            <p><strong>Recomendaciones:</strong> Monitorizar posibles reacciones</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            allergies.forEach((allergy, index) => {
                const allergyElement = document.createElement('div');
                allergyElement.className = `allergy-item ${allergy.severity}`;
                allergyElement.innerHTML = `
                    <div class="allergy-header">
                        <span class="allergy-name">${allergy.name}</span>
                        <span class="severity-badge">${allergy.severity}</span>
                        <div class="allergy-actions">
                            <button class="edit-btn" data-index="${index}">✏️</button>
                            <button class="delete-btn" data-index="${index}">🗑️</button>
                        </div>
                    </div>
                    <div class="allergy-details">
                        <p><strong>Síntomas:</strong> ${allergy.symptoms}</p>
                        <p><strong>Recomendaciones:</strong> ${allergy.recommendations}</p>
                    </div>
                `;
                elements.container.appendChild(allergyElement);
            });
            
            // Añadir event listeners
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentEditIndex = parseInt(btn.dataset.index);
                    openEditModal(allergies[currentEditIndex]);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    if (confirm('¿Eliminar esta alergia?')) {
                        allergies.splice(index, 1);
                        renderAllergies();
                        updateHiddenInput();
                    }
                });
            });
        };

        // 6. Funciones auxiliares
        const openEditModal = (allergy) => {
        if (!elements.title || !elements.nameInput || !elements.severitySelect) {
            console.error('Elementos del modal no disponibles');
            return;
        }

        elements.title.textContent = 'Editar Alergia';
        elements.nameInput.value = allergy.name || '';
        elements.severitySelect.value = allergy.severity || 'leve';
        elements.symptomsInput.value = allergy.symptoms || '';
        elements.recomInput.value = allergy.recommendations || '';
        elements.modal.style.display = 'flex';
    };

        const updateHiddenInput = () => {
            const input = document.getElementById('alergias_json');
            if (input) {
                input.value = JSON.stringify(allergies);
            }
        };

        // 7. Inicialización
        initAllergies();
        renderAllergies();

        // 8. Event listeners
        elements.addBtn.addEventListener('click', () => {
            currentEditIndex = -1;
            elements.nameInput.value = '';
            elements.severitySelect.value = 'leve';
            elements.symptomsInput.value = '';
            elements.recomInput.value = '';
            elements.title.textContent = 'Añadir Alergia';
            elements.modal.style.display = 'flex';
        });

        elements.saveBtn.addEventListener('click', () => {
            const allergy = {
                name: elements.nameInput.value,
                severity: elements.severitySelect.value,
                symptoms: elements.symptomsInput.value,
                recommendations: elements.recomInput.value,
                date: new Date().toLocaleDateString()
            };
            
            if (currentEditIndex >= 0) {
                allergies[currentEditIndex] = allergy;
            } else {
                // Eliminar placeholder si existe
                allergies = allergies.filter(a => !a.isPlaceholder);
                allergies.push(allergy);
            }
            
            renderAllergies();
            elements.modal.style.display = 'none';
            updateHiddenInput();
        });

        elements.cancelBtn.addEventListener('click', () => {
            elements.modal.style.display = 'none';
        });

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (event) => {
            if (event.target === elements.modal) {
                elements.modal.style.display = 'none';
            }
        });

        // Manejar checkbox de alergia desconocida si existe
        if (elements.unknownCheckbox) {
            elements.unknownCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    elements.formFields.style.display = 'none';
                    elements.nameInput.value = 'Alergias desconocidas';
                    elements.severitySelect.value = 'indeterminada';
                    elements.symptomsInput.value = 'No se han identificado alergias aún';
                    elements.recomInput.value = 'Monitorizar posibles reacciones';
                } else {
                    elements.formFields.style.display = 'block';
                }
            });
        }
}
  
    // Actualizar campo oculto para el formulario
    function updateHiddenInput() {
        const input = document.getElementById('alergias_json');
        input.value = JSON.stringify(allergies);
    }
    
    // Funciones auxiliares para el modal
    function resetModal() {
        document.getElementById('allergyName').value = '';
        document.getElementById('allergySeverity').value = 'leve';
        document.getElementById('allergySymptoms').value = '';
        document.getElementById('allergyRecom').value = '';
        unknownAllergyCheckbox.checked = false;
        allergyFormFields.classList.remove('hidden');
    }
    
    function fillModal(allergy) {
        document.getElementById('allergyName').value = allergy.name;
        document.getElementById('allergySeverity').value = allergy.severity;
        document.getElementById('allergySymptoms').value = allergy.symptoms;
        document.getElementById('allergyRecom').value = allergy.recommendations;
        unknownAllergyCheckbox.checked = allergy.severity === 'indeterminada' && allergy.name.toLowerCase().includes('desconocid');
        if (unknownAllergyCheckbox.checked) {
            allergyFormFields.classList.add('hidden');
        }
    }
    
    // Cerrar modal
    cancelAllergyBtn.addEventListener('click', function() {
        allergyModal.style.display = 'none';
    });
    
    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', function(event) {
        if (event.target === allergyModal) {
            allergyModal.style.display = 'none';
        }
    });