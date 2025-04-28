import { auth, db } from '/static/js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

window.vaccinationChart = null;

function getVaccinationStatus(vacunas) {
  if (!vacunas || vacunas.length === 0) return 'none';

  const total = 4;
  const aplicadas = vacunas.filter(v => v.estado === 'completa').length;

  if (aplicadas === 0) return 'none';
  if (aplicadas === total) return 'complete';
  return 'partial';
}

function updateChart(stats) {
  const canvas = document.getElementById('vaccinationChart');
  if (!canvas) {
    console.error('No se encontró el elemento canvas para la gráfica');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Si ya existe una gráfica previa, destrúyela antes de crear una nueva
  if (window.vaccinationChart) {
    window.vaccinationChart.destroy();
  }
  
  // Variables CSS
  const styles = getComputedStyle(document.body);
  const textColor = styles.getPropertyValue('--text-color').trim() || '#f1f5f9';
  const bgComplete = styles.getPropertyValue('--accent').trim() || '#38bdf8';
  const bgPartial = styles.getPropertyValue('--warning').trim() || '#facc15';
  const bgNone = styles.getPropertyValue('--danger').trim() || '#f43f5e';
  const gridLineColor = 'rgba(255, 255, 255, 0.05)';

  window.vaccinationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Completas', 'Parciales', 'Sin vacunar'],
      datasets: [{
        label: 'Estado de Vacunación',
        data: [stats.complete, stats.partial, stats.none],
        backgroundColor: [bgComplete, bgPartial, bgNone],
        borderRadius: 8,
        barThickness: 60,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(30,41,59,0.9)',
          titleColor: textColor,
          bodyColor: textColor,
          titleFont: {
            family: 'Poppins',
            weight: 'bold',
            size: 14
          },
          bodyFont: {
            family: 'Nunito',
            size: 13
          },
          padding: 10,
          borderWidth: 1,
          borderColor: gridLineColor,
          cornerRadius: 8
        },
        // AQUI AGREGAMOS LAS ETIQUETAS DE DATOS
        datalabels: {
          display: true,
          color: textColor,
          anchor: 'center',
          align: 'center',
          font: {
            family: 'Nunito',
            size: 14,
            weight: 'bold'
          },
          formatter: function(value) {
            return value; // Muestra el valor tal cual
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            font: {
              family: 'Nunito',
              size: 12
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            font: {
              family: 'Nunito',
              size: 12
            },
            stepSize: 1
          },
          grid: {
            color: gridLineColor
          }
        }
      }
    },
    // Necesitamos agregar el plugin de datalabels
    plugins: [ChartDataLabels]
  });
}

// Función principal para cargar los datos
async function loadVaccinationData() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Obtener todas las mascotas (o solo las del usuario si no es admin)
        let q;
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
            q = collection(db, "mascotas");
        } 
        
        const querySnapshot = await getDocs(q);
        const pets = [];
        const stats = { complete: 0, partial: 0, none: 0 };
        const tableBody = document.querySelector('#pets-table tbody');
        tableBody.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const petData = doc.data();
            const status = getVaccinationStatus(petData.vacunas);
            
            // Actualizar estadísticas
            stats[status]++;
            
            // Agregar fila a la tabla
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${petData.nombre}</td>
                <td>${petData.especie}</td>
                <td>${petData.vacunas?.length || 0}</td>
                <td class="status-${status}">${
                    status === 'complete' ? 'Completa' : 
                    status === 'partial' ? 'Parcial' : 'Sin vacunar'
                }</td>
            `;
            tableBody.appendChild(row);
            
            pets.push({...petData, id: doc.id, status});
        });
        
        // Actualizar la gráfica
        updateChart(stats);
        
        // Actualizar los resúmenes
        document.getElementById('total-pets').textContent = pets.length;
        document.getElementById('fully-vaccinated').textContent = stats.complete;
        document.getElementById('partial-vaccinated').textContent = stats.partial;
        document.getElementById('not-vaccinated').textContent = stats.none;
        
    } catch (error) {
        console.error("Error al cargar datos de vacunación:", error);
        alert("Error al cargar los datos de vacunación");
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
      // Espera a que Firebase se inicialice
      await import('/static/js/firebase-config.js');
      
      onAuthStateChanged(auth, (user) => {
          if (user) {
              loadVaccinationData();
          } else {
              window.location.href = "/vistas/login.html";
          }
      });
  } catch (error) {
      console.error("Error al inicializar Firebase:", error);
      alert("Error al cargar la aplicación");
  }
});