console.log("El archivo JavaScript se está cargando");
import { auth, db } from './firebase-config.js';
import {  onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {  
  collection, 
  addDoc,
  doc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Función para listar mascotas del usuario actual
async function listarMascotasUsuario(userId) {
  try {
    const q = query(collection(db, "mascotas"), where("dueñoId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const mascotas = [];
    querySnapshot.forEach((doc) => {
      mascotas.push({ id: doc.id, ...doc.data() });
    });
    
    return mascotas;
  } catch (error) {
    console.error("Error al listar mascotas:", error);
    return [];
  }
}

// Función para mostrar mascotas en cards
// Función para generar las cards dinámicamente (ejemplo)
function mostrarMascotasEnCards(mascotas) {
  const contenedor = document.getElementById('contenedor-cards');
  contenedor.innerHTML = '';
  
  mascotas.forEach(mascota => {
      const card = document.createElement('div');
      card.className = 'card-mascota';
      
      // Determinar icono según especie
      const iconoEspecie = mascota.especie.toLowerCase() === 'perro' ? 
          'fa-dog' : 'fa-cat';
      
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
                <span>${mascota.raza || 'No especificado'}</span>
            </div>
            <div class="dato-mascota">
                <strong>Edad:</strong>
                <span>${mascota.edad || 'No especificado'}</span>
            </div>
            <div class="dato-mascota">
                <strong>Peso:</strong>
                <span>${mascota.peso ? mascota.peso + ' kg' : 'No especificado'}</span>
            </div>
            <div class="dato-mascota">
              <strong>Vacunas:</strong>
              <span>${mascota.vacunas ? mascota.vacunas.join(', ') : 'No especificado'}</span>
            </div>
            
            <button class="btn-ver-mas">Ver más detalles ↓</button>
            
            <div class="detalles-adicionales">
                  <div class="dato-mascota">
                      <strong>Color:</strong>
                      <span>${mascota.color || 'No especificado'}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Alimentación:</strong>
                      <span>${mascota.alimentacion || 'No especificado'}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Comportamiento:</strong>
                      <span>${mascota.comportamiento || 'No especificado'}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Alergias:</strong>
                      <span>${mascota.alergias || 'Ninguna'}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Última consulta:</strong>
                      <span>${mascota.ultimaConsulta || 'No registrada'}</span>
                  </div>
                  <div class="dato-mascota">
                      <strong>Veterinario:</strong>
                      <span>${mascota.veterinario || 'No asignado'}</span>
                  </div>
                  ${mascota.historial ? `
                  <div class="dato-mascota">
                      <strong>Historial médico:</strong>
                      <span>${mascota.historial}</span>
                  </div>` : ''}
                  ${mascota.observaciones ? `
                  <div class="dato-mascota">
                      <strong>Observaciones:</strong>
                      <span>${mascota.observaciones}</span>
                  </div>` : ''}
              </div>
          </div>
      <div class="card-footer">
          <button class="btn-mascota btn-editar" data-id="${mascota.id}">Editar</button>
          <button class="btn-mascota btn-eliminar" data-id="${mascota.id}">Eliminar</button>
      </div>
      `;
      
      contenedor.appendChild(card);
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

// 1. Función para manejar la edición de mascotas
async function manejarEdicionMascota() {
  // Verificar si estamos en la página de edición
  if (!window.location.pathname.includes('/vistas/mascotas/modificarmascota.html')) return;

  const urlParams = new URLSearchParams(window.location.search);
  const idMascota = urlParams.get('id');
  
  if (!idMascota) {
    alert("No se especificó una mascota para editar");
    window.location.href = "/vistas/mascotas/listarmascotas.html";
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/vistas/login.html";
      return;
    }

    // Obtener datos de la mascota
    const mascota = await obtenerMascotaPorId(idMascota);

    console.log("Datos a llenar:", {
      nombre: mascota.nombre,
      especie: mascota.especie,
      // ... todos los demás campos
    });


    console.log("Elementos del formulario encontrados:", {
      nombre: document.getElementById('nombre'),
      especie: document.getElementById('especie'),
      // ... todos los demás campos
    });
    
    if (!mascota || mascota.dueñoId !== user.uid) {
      alert("No tienes permiso para editar esta mascota");
      window.location.href = "/vistas/mascotas/listarmascotas.html";
      return;
    }

    // Rellenar formulario con datos existentes
    const form = document.getElementById('form-mascota');
    if (form) {
        document.getElementById('nombre').value = mascota.nombre || '';
        document.getElementById('especie').value = mascota.especie || '';
        document.getElementById('raza').value = mascota.raza || '';
        document.getElementById('color').value = mascota.color || '';
        document.getElementById('peso').value = mascota.peso || '';
        document.getElementById('edad').value = mascota.edad || '';
        document.getElementById('alimentacion').value = mascota.alimentacion || '';
        document.getElementById('comportamiento').value = mascota.comportamiento || '';
        document.getElementById('medicamentos').value = mascota.medicamentos || '';
        const vacunas = mascota.vacunas || [];
        document.querySelectorAll('input[name="vacunas"]').forEach(checkbox => {
        checkbox.checked = vacunas.includes(checkbox.value)});
        document.getElementById('alergias').value = mascota.alergias || '';
        document.getElementById('historial').value = mascota.historial || '';
        document.getElementById('ultima_consulta').value = mascota.ultimaConsulta || '';
        const seguroValue = mascota.seguro || 'no';
        document.querySelector(`input[name="seguro"][value="${seguroValue}"]`).checked = true;
        document.getElementById('veterinario').value = mascota.veterinario || '';
        document.getElementById('observaciones').value = mascota.observaciones || '';

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          // Obtener los checkboxes de vacunas seleccionados
        const vacunasSeleccionadas = [];
        document.querySelectorAll('input[name="vacunas"]:checked').forEach(checkbox => {
            vacunasSeleccionadas.push(checkbox.value);
        });
        
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
            vacunas: vacunasSeleccionadas, // Cambiamos a array de vacunas
            fechaUltimaVacuna: document.getElementById("fecha_ultima_vacuna").value || null,
            alergias: document.getElementById("alergias").value,
            historial: document.getElementById("historial").value,
            ultimaConsulta: document.getElementById("ultima_consulta").value,
            seguro: document.querySelector('input[name="seguro"]:checked').value,
            veterinario: document.getElementById("veterinario").value,
            observaciones: document.getElementById("observaciones").value,
            dueñoId: user.uid,
            fechaActualizacion: new Date()
        };

          await updateDoc(doc(db, "mascotas", idMascota), mascotaData);
          alert("Mascota actualizada correctamente");
          window.location.href = "/vistas/mascotas/listarmascotas.html";
        } catch (error) {
          console.error("Error al actualizar mascota:", error);
          alert("Error al actualizar mascota");
        }
      });
    }
  });
}

// Modifica EventListenersAcciones para redirigir correctamente
function EventListenersAcciones() {
  // Eliminar mascota (mantén este código igual)
  document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idMascota = e.target.dataset.id;
      if (confirm('¿Estás seguro de eliminar esta mascota?')) {
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
  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idMascota = e.target.dataset.id;
      localStorage.setItem('mascotaEditarId', idMascota);
      window.location.href = `/vistas/mascotas/modificarmascota.html?id=${idMascota}`;
    });
  });

  //ver detalles
  document.getElementById('contenedor-cards').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-ver-mas')) {
        const card = e.target.closest('.card-mascota');
        const detalles = card.querySelector('.detalles-adicionales');
        
        // Cerrar otros detalles abiertos
        document.querySelectorAll('.detalles-adicionales.active').forEach(d => {
            if (d !== detalles) {
                d.classList.remove('active');
                d.previousElementSibling.textContent = 'Ver más detalles ↓';
            }
        });
        
        detalles.classList.toggle('active');
        e.target.textContent = detalles.classList.contains('active') 
            ? 'Ver menos detalles ↑' 
            : 'Ver más detalles ↓';
    }
});
}

// Modifica el event listener DOMContentLoaded para incluir manejarEdicionMascota
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Listar mascotas si estamos en esa página
    if (document.getElementById('contenedor-cards')) {
      const mascotas = await listarMascotasUsuario(user.uid);
      mostrarMascotasEnCards(mascotas);
    }

    // Si estamos en la página de registro
    if (document.getElementById('submit')) {
      const submit = document.getElementById("submit");
      submit.addEventListener("click", async function(event) {
        event.preventDefault();
        try {
          // Obtener valores del formulario
          // Obtener los checkboxes de vacunas seleccionados
        const vacunasSeleccionadas = [];
        document.querySelectorAll('input[name="vacunas"]:checked').forEach(checkbox => {
            vacunasSeleccionadas.push(checkbox.value);
        });
        
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
            vacunas: vacunasSeleccionadas, // Cambiamos a array de vacunas
            fechaUltimaVacuna: document.getElementById("fecha_ultima_vacuna").value || null,
            alergias: document.getElementById("alergias").value,
            historial: document.getElementById("historial").value,
            ultimaConsulta: document.getElementById("ultima_consulta").value,
            seguro: document.querySelector('input[name="seguro"]:checked')?.value || 'no',
            veterinario: document.getElementById("veterinario").value,
            observaciones: document.getElementById("observaciones").value,
            dueñoId: user.uid,
            fechaCreacion: new Date()
        };
  
          // Validación básica
          if (!mascotaData.nombre || !mascotaData.especie) {
            throw new Error("Nombre y especie son campos obligatorios");
          }
  
          // Guardar en Firestore
          const docRef = await addDoc(collection(db, "mascotas"), mascotaData);
          console.log("Mascota creada con ID:", docRef.id); //  Ahora se usa docRef
          alert(`Mascota registrada con ID: ${docRef.id}`);
          
          alert("Mascota registrada exitosamente!");
          // Opcional: limpiar formulario o redirigir
          window.location.href = "/vistas/mascotas/listarmascotas.html";
          
        } catch (error) {
          console.error("Error al agregar mascota:", error);
          alert("Error: " + error.message);
        }
      });
    }

    // Manejar la edición si estamos en esa página
    manejarEdicionMascota();
  });
});