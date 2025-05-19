document.addEventListener('DOMContentLoaded', function() {
    // Simulación de datos (en un caso real, estos vendrían de tu API)
    const userData = {
        allergies: [
            "Alergia al pollo - vomita después de comer",
            "Picazón en las patas",
            "Reacción a ciertos jabones"
        ],
        behaviorNotes: "El perro ladra mucho cuando nos vamos y destruye cosas",
        medicalHistory: "Esterilizado en 2023. Vacunas al día. Problema de piel el año pasado."
    };
    
    // Cargar recomendaciones al iniciar
    loadRecommendations(userData);
    
    // Botón de refrescar
    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadRecommendations(userData);
    });
});

function loadRecommendations(userData) {
    // Mostrar estados de carga
    showLoadingStates();
    
    // Simular carga asíncrona
    setTimeout(() => {
        generateAllergyRecommendations(userData.allergies);
        generateBehaviorRecommendations(userData.behaviorNotes);
        generateMedicalRecommendations(userData.medicalHistory);
    }, 1000);
}

function showLoadingStates() {
    const containers = [
        'allergy-recommendations',
        'behavior-recommendations',
        'medical-recommendations'
    ];
    
    containers.forEach(id => {
        document.getElementById(id).innerHTML = `
            <div class="loading-recommendation">
                <i class="material-icons spin">autorenew</i>
                Analizando información...
            </div>`;
    });
}

function generateAllergyRecommendations(allergies) {
    const container = document.getElementById('allergy-recommendations');
    let recommendations = [];
    
    if (!allergies || allergies.length === 0) {
        recommendations.push({
            text: "No se registraron alergias. Agrega alguna para recibir recomendaciones específicas.",
            type: "general"
        });
    } else {
        // Análisis simple de texto
        allergies.forEach(allergy => {
            if (allergy.toLowerCase().includes('pollo') || allergy.toLowerCase().includes('comida')) {
                recommendations.push({
                    text: "Para alergias alimentarias: Considera una dieta de eliminación con tu veterinario",
                    type: "specific"
                });
            }
            
            if (allergy.toLowerCase().includes('picazón') || allergy.toLowerCase().includes('ronchas')) {
                recommendations.push({
                    text: "Para problemas de piel: Baños con champú hipoalergénico cada 2 semanas",
                    type: "specific"
                });
            }
        });
        
        // Recomendación genérica si no se detectó nada específico
        if (recommendations.length === 0) {
            recommendations.push({
                text: "Consulta con tu veterinario sobre pruebas de alergia para identificar causas exactas",
                type: "general"
            });
        }
    }
    
    // Añadir recomendación base
    recommendations.push({
        text: "Registra cualquier reacción nueva inmediatamente",
        type: "general"
    });
    
    renderRecommendations(container, recommendations);
}

function generateBehaviorRecommendations(behaviorNotes) {
    const container = document.getElementById('behavior-recommendations');
    let recommendations = [];
    
    if (!behaviorNotes || behaviorNotes.trim() === "") {
        recommendations.push({
            text: "No hay notas de comportamiento. Describe algún problema para recibir ayuda.",
            type: "general"
        });
    } else {
        // Detección de patrones simples
        if (behaviorNotes.toLowerCase().includes('ladra')) {
            recommendations.push({
                text: "Para ladridos excesivos: Entrenamiento con comandos 'silencio' y recompensas por calmarse",
                type: "specific"
            });
        }
        
        if (behaviorNotes.toLowerCase().includes('destru')) {
            recommendations.push({
                text: "Para comportamiento destructivo: Proporciona juguetes resistentes y ejercicio suficiente",
                type: "specific"
            });
        }
        
        // Recomendación genérica si no se detectó nada específico
        if (recommendations.length === 0) {
            recommendations.push({
                text: "Considera sesiones de entrenamiento básico para mejorar el comportamiento",
                type: "general"
            });
        }
    }
    
    // Añadir recomendación base
    recommendations.push({
        text: "Consistencia y paciencia son clave en el entrenamiento",
        type: "general"
    });
    
    renderRecommendations(container, recommendations);
}

function generateMedicalRecommendations(medicalHistory) {
    const container = document.getElementById('medical-recommendations');
    let recommendations = [];
    
    if (!medicalHistory || medicalHistory.trim() === "") {
        recommendations.push({
            text: "Completa el historial médico para recibir recomendaciones personalizadas",
            type: "general"
        });
    } else {
        // Detección de patrones simples
        if (medicalHistory.toLowerCase().includes('piel')) {
            recommendations.push({
                text: "Para problemas de piel: Control regular con veterinario y dieta rica en ácidos grasos",
                type: "specific"
            });
        }
        
        if (medicalHistory.toLowerCase().includes('esterilizado')) {
            recommendations.push({
                text: "Mascotas esterilizadas pueden tender al aumento de peso - controla su dieta",
                type: "specific"
            });
        }
        
        // Recomendación genérica si no se detectó nada específico
        if (recommendations.length === 0) {
            recommendations.push({
                text: "Visitas veterinarias anuales recomendadas para chequeo general",
                type: "general"
            });
        }
    }
    
    // Añadir recomendación base
    recommendations.push({
        text: "Mantén un registro de vacunas y tratamientos al día",
        type: "general"
    });
    
    renderRecommendations(container, recommendations);
}

function renderRecommendations(container, recommendations) {
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Asegurarse de que recommendations es un array
    if (!Array.isArray(recommendations)) {
        recommendations = [recommendations];
    }
    
    // Añadir cada recomendación
    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = `recommendation-item ${rec.type}`;
        item.textContent = rec.text;
        container.appendChild(item);
    });
}