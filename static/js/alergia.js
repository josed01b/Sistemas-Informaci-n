import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Variables globales
let currentUser = null;
let userPets = [];
let currentAllergies = [];
let currentEditId = null;

// Elementos del DOM
const elements = {
  allergiesContainer: document.getElementById("allergiesContainer"),
  addAllergyBtn: document.getElementById("addAllergyBtn"),
  allergyModal: document.getElementById("allergyModal"),
  modalTitle: document.getElementById("modalTitle"),
  petSelect: document.getElementById("petSelect"),
  allergyName: document.getElementById("allergyName"),
  allergySeverity: document.getElementById("allergySeverity"),
  detectionDate: document.getElementById("detectionDate"), // Corregido para coincidir con HTML
  allergySymptoms: document.getElementById("allergySymptoms"),
  allergyReaction: document.getElementById("allergyReaction"),
  allergyRecommendations: document.getElementById("allergyRecommendations"),
  saveAllergyBtn: document.getElementById("saveAllergyBtn"),
  cancelAllergyBtn: document.getElementById("cancelAllergyBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
};

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  checkAuthState();
});

// Configurar event listeners
function setupEventListeners() {
  elements.addAllergyBtn.addEventListener("click", openAddModal);
  elements.saveAllergyBtn.addEventListener("click", saveAllergy);
  elements.cancelAllergyBtn.addEventListener("click", closeModal);
  elements.closeModalBtn.addEventListener("click", closeModal);

  // Cerrar modal al hacer clic fuera del contenido
  elements.allergyModal.addEventListener("click", (e) => {
    if (e.target === elements.allergyModal) {
      closeModal();
    }
  });
}

// Verificar autenticación
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await loadUserPets();
      await loadAllergies();
    } else {
      window.location.href = "/vistas/login.html";
    }
  });
}

// Cargar mascotas del usuario
async function loadUserPets() {
  try {
    const q = query(
      collection(db, "mascotas"),
      where("ownerId", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(q);

    userPets = [];
    querySnapshot.forEach((doc) => {
      userPets.push({ id: doc.id, ...doc.data() });
    });

    updatePetSelect();
  } catch (error) {
    console.error("Error cargando mascotas:", error);
    showAlert("Error al cargar las mascotas", "error");
  }
}

// Actualizar selector de mascotas
function updatePetSelect() {
  elements.petSelect.innerHTML =
    '<option value="">Selecciona una mascota</option>';

  userPets.forEach((pet) => {
    const option = document.createElement("option");
    option.value = pet.id;
    option.textContent = `${pet.nombre} (${pet.especie || "N/A"})`;
    elements.petSelect.appendChild(option);
  });
}

// Cargar alergias
async function loadAllergies() {
  try {
    currentAllergies = [];

    for (const pet of userPets) {
      if (pet.alergias && pet.alergias.length > 0) {
        const petAllergies = Array.isArray(pet.alergias)
          ? pet.alergias
          : JSON.parse(pet.alergias || "[]");

        petAllergies.forEach((allergy, index) => {
          currentAllergies.push({
            ...allergy,
            id: `${pet.id}_${index}`, // ID único para cada alergia
            petId: pet.id,
            petName: pet.nombre,
            petSpecies: pet.especie,
          });
        });
      }
    }

    renderAllergies();
  } catch (error) {
    console.error("Error cargando alergias:", error);
    showAlert("Error al cargar las alergias", "error");
  }
}

// Mostrar alergias
function renderAllergies() {
  if (currentAllergies.length === 0) {
    elements.allergiesContainer.innerHTML = `
            <div class="empty-state">
                <i class="material-icons">info</i>
                <p>No se han registrado alergias para tus mascotas</p>
            </div>
        `;
    return;
  }

  elements.allergiesContainer.innerHTML = "";

  currentAllergies.forEach((allergy) => {
    const severity = getSeverityInfo(allergy.severity);

    const allergyCard = document.createElement("div");
    allergyCard.className = "allergy-card";
    allergyCard.innerHTML = `
        <div class="allergy-header">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="allergy-title">${allergy.name}</span>
                <span class="severity-badge ${severity.class}">${severity.text}</span>
            </div>
            <div class="allergy-pet">
                <i class="material-icons">${
                  allergy.petSpecies === "perro" ? "pets" : "pets"
                }</i>
                <span>${allergy.petName}</span>
            </div>
        </div>
    
        <div class="allergy-card-body">
            <div class="allergy-info-grid">
                <div class="info-item">
                    <span class="info-label">Fecha de detección</span>
                    <span class="info-value">${
                      allergy.date || "No especificada"
                    }</span>
                </div>
            
                <div class="info-item">
                    <span class="info-label">Síntomas</span>
                    <span class="info-value">${
                      allergy.symptoms || "No especificados"
                    }</span>
                </div>
            
                ${
                  allergy.reaction
                    ? `
                <div class="info-item">
                    <span class="info-label">Reacciones</span>
                    <span class="info-value">${allergy.reaction}</span>
                </div>`
                    : ""
                }
            
                <div class="info-item">
                    <span class="info-label">Recomendaciones</span>
                    <span class="info-value">${
                      allergy.recommendations || "No especificadas"
                    }</span>
                </div>
            </div>
        </div>
    
        <div class="allergy-card-footer">
            <button class="edit-btn" data-id="${allergy.id}">
                <i class="material-icons">edit</i> Editar
            </button>
            <button class="delete-btn" data-id="${allergy.id}">
                <i class="material-icons">delete</i> Eliminar
            </button>
        </div>
    `;

    elements.allergiesContainer.appendChild(allergyCard);
  });

  // Agregar event listeners a los nuevos botones
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const allergyId = e.currentTarget.getAttribute("data-id");
      editAllergy(allergyId);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const allergyId = e.currentTarget.getAttribute("data-id");
      deleteAllergy(allergyId);
    });
  });
}

// Información de severidad
function getSeverityInfo(severity) {
  const severities = {
    leve: { class: "severity-low", text: "Leve" },
    moderada: { class: "severity-medium", text: "Moderada" },
    grave: { class: "severity-high", text: "Grave" },
    default: { class: "severity-unknown", text: "Desconocida" },
  };

  return severities[severity] || severities.default;
}

// Abrir modal para añadir/editar
function openAddModal() {
  currentEditId = null;
  elements.modalTitle.textContent = "Añadir Nueva Alergia";
  resetModalForm();
  elements.allergyModal.style.display = "flex";
}

// Editar alergia existente
function editAllergy(allergyId) {
  const allergy = currentAllergies.find((a) => a.id === allergyId);
  if (!allergy) return;

  currentEditId = allergyId;
  elements.modalTitle.textContent = "Editar Alergia";

  // Llenar formulario con datos existentes
  elements.petSelect.value = allergy.petId;
  elements.allergyName.value = allergy.name;
  elements.allergySeverity.value = allergy.severity;
  elements.detectionDate.value = allergy.date || "";
  elements.allergySymptoms.value = allergy.symptoms || "";
  elements.allergyReaction.value = allergy.reaction || "";
  elements.allergyRecommendations.value = allergy.recommendations || "";

  elements.allergyModal.style.display = "flex";
}

// Guardar alergia (añadir o editar)
async function saveAllergy() {
  try {
    // Validación
    if (!validateForm()) return;

    const petId = elements.petSelect.value;
    const allergyData = {
      name: elements.allergyName.value.trim(),
      severity: elements.allergySeverity.value,
      date: elements.detectionDate.value,
      symptoms: elements.allergySymptoms.value.trim(),
      reaction: elements.allergyReaction.value.trim(),
      recommendations: elements.allergyRecommendations.value.trim(),
    };

    // Mostrar carga
    elements.saveAllergyBtn.disabled = true;
    elements.saveAllergyBtn.innerHTML =
      '<i class="material-icons">hourglass_top</i> Guardando...';

    if (currentEditId) {
      await updateExistingAllergy(petId, allergyData);
    } else {
      await addNewAllergy(petId, allergyData);
    }

    showAlert(
      `Alergia ${currentEditId ? "actualizada" : "registrada"} correctamente`,
      "success"
    );
    closeModal();
    await loadUserPets();
    await loadAllergies();
  } catch (error) {
    console.error("Error guardando alergia:", error);
    showAlert(`Error: ${error.message}`, "error");
  } finally {
    // Restaurar botón
    elements.saveAllergyBtn.disabled = false;
    elements.saveAllergyBtn.innerHTML =
      '<i class="material-icons">save</i> Guardar';
  }
}

// Validar formulario
function validateForm() {
  const errors = [];

  if (!elements.petSelect.value) {
    errors.push("Selecciona una mascota");
  }

  if (!elements.allergyName.value.trim()) {
    errors.push("Ingresa el nombre de la alergia");
  }

  if (!elements.allergySeverity.value) {
    errors.push("Selecciona un nivel de severidad");
  }

  if (errors.length > 0) {
    showAlert(errors.join("\n"), "error");
    return false;
  }

  return true;
}

// Añadir nueva alergia
async function addNewAllergy(petId, allergyData) {
  try {
    const petRef = doc(db, "mascotas", petId);

    // 1. Obtener el documento actual
    const petSnapshot = await getDoc(petRef);

    if (!petSnapshot.exists()) {
      throw new Error("Mascota no encontrada");
    }

    // 2. Obtener alergias existentes
    const petData = petSnapshot.data();
    let currentAllergies = [];

    if (petData.alergias) {
      currentAllergies = Array.isArray(petData.alergias)
        ? [...petData.alergias]
        : JSON.parse(petData.alergias);
    }

    // 3. Preparar nueva alergia
    const newAllergy = {
      name: allergyData.name,
      severity: allergyData.severity,
      date: allergyData.date || new Date().toISOString().split("T")[0],
      symptoms: allergyData.symptoms,
      reaction: allergyData.reaction,
      recommendations: allergyData.recommendations,
    };

    // 4. Añadir la nueva alergia
    currentAllergies.push(newAllergy);

    // 5. Actualizar el documento
    await updateDoc(petRef, {
      alergias: currentAllergies,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error añadiendo alergia:", error);
    throw error;
  }
}

// Actualizar alergia existente
async function updateExistingAllergy(petId, updatedAllergy) {
  try {
    const petRef = doc(db, "mascotas", petId);
    const petSnapshot = await getDoc(petRef);

    if (!petSnapshot.exists()) {
      throw new Error("Mascota no encontrada");
    }

    const petData = petSnapshot.data();
    let currentAllergies = [];

    if (petData.alergias) {
      currentAllergies = Array.isArray(petData.alergias)
        ? [...petData.alergias]
        : JSON.parse(petData.alergias);
    }

    // Encontrar el índice de la alergia a editar
    const [_, indexStr] = currentEditId.split("_");
    const index = parseInt(indexStr);

    if (isNaN(index) || index < 0 || index >= currentAllergies.length) {
      throw new Error("Índice de alergia no válido");
    }

    // Actualizar solo los campos modificables
    currentAllergies[index] = {
      ...currentAllergies[index], // Mantener datos existentes
      name: updatedAllergy.name,
      severity: updatedAllergy.severity,
      date: updatedAllergy.date || currentAllergies[index].date,
      symptoms: updatedAllergy.symptoms,
      reaction: updatedAllergy.reaction,
      recommendations: updatedAllergy.recommendations,
    };

    await updateDoc(petRef, {
      alergias: currentAllergies,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error actualizando alergia:", error);
    throw error;
  }
}

// Eliminar alergia
async function deleteAllergy(allergyId) {
  if (!confirm("¿Estás seguro de eliminar esta alergia?")) return;

  try {
    const [petId, index] = allergyId.split("_");
    const pet = userPets.find((p) => p.id === petId);

    if (!pet || !pet.alergias) return;

    const updatedAllergies = pet.alergias.filter(
      (_, i) => i !== parseInt(index)
    );

    const petRef = doc(db, "mascotas", petId);
    await updateDoc(petRef, {
      alergias: updatedAllergies,
      lastUpdated: serverTimestamp(),
    });

    showAlert("Alergia eliminada correctamente", "success");
    await loadAllergies();
  } catch (error) {
    console.error("Error eliminando alergia:", error);
    showAlert("Error al eliminar la alergia", "error");
  }
}

// Cerrar modal
function closeModal() {
  elements.allergyModal.style.display = "none";
  resetModalForm();
}

// Reiniciar formulario
function resetModalForm() {
  elements.petSelect.value = "";
  elements.allergyName.value = "";
  elements.allergySeverity.value = "leve";
  elements.detectionDate.value = "";
  elements.allergySymptoms.value = "";
  elements.allergyReaction.value = "";
  elements.allergyRecommendations.value = "";
  currentEditId = null;
}

// Mostrar notificación
function showAlert(message, type = "Hecho") {
  alert(`${type.toUpperCase()}: ${message}`);
}
