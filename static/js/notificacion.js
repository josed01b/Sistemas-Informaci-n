import { auth } from '/static/js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Variable para controlar el estado de la notificación
let passwordNotificationActive = false;

// Función para verificar si debe mostrarse la notificación
export async function checkPasswordNotification() {
    const lastChange = localStorage.getItem('lastPasswordChange');
    const daysSinceChange = lastChange ? 
        (new Date() - new Date(lastChange)) / (1000 * 60 * 60 * 24): 
        Infinity;
    
    // Mostrar notificación si nunca ha cambiado o hace más de 90 días
    passwordNotificationActive = !lastChange || daysSinceChange > 90;
    updateNotificationBadge();
    return passwordNotificationActive;
}

// Función para actualizar el badge
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (passwordNotificationActive) {
            badge.textContent = '1';
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Inicialización
export function initPasswordNotifications() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            checkPasswordNotification();
        }
    });
}

// Para marcar como leída cuando cambian la contraseña
export function markPasswordNotificationAsRead() {
    localStorage.setItem('lastPasswordChange', new Date().toISOString());
    passwordNotificationActive = false;
    updateNotificationBadge();
}

// Nuevas funciones para la página de notificaciones (se integran con las existentes)
export async function loadNotificationsPage() {
    const hasNotification = await checkPasswordNotification();
    const container = document.getElementById('notification-list');
    
    if (!container) return;
    
    if (hasNotification) {
        container.innerHTML = `
            <div class="notification-card unread notification-warning">
                <i class="ri-shield-keyhole-line notification-icon"></i>
                <div class="notification-content">
                    <div class="notification-title">Actualiza tu contraseña</div>
                    <div class="notification-message">Por seguridad, te recomendamos cambiar tu contraseña periódicamente.</div>
                    <div class="notification-time">Hoy</div>
                </div>
                <div class="notification-actions">
                    <button class="notification-action mark-as-read" data-id="password-notification">
                        <i class="ri-check-line"></i>
                    </button>
                    <a href="/vistas/seguridad/cambiar_contrasena.html" class="notification-action">
                        <i class="ri-arrow-right-line"></i>
                    </a>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="no-notifications">
                <i class="ri-notification-off-line" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>No tienes notificaciones nuevas</p>
            </div>
        `;
    }
}

export function setupNotificationEvents() {
    // Configurar botón "Marcar todas como leídas"
    document.getElementById('mark-all-read')?.addEventListener('click', () => {
        markPasswordNotificationAsRead();
        const container = document.getElementById('notification-list');
        if (container) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i class="ri-notification-off-line" style="font-size: 40px; margin-bottom: 10px;"></i>
                    <p>No tienes notificaciones nuevas</p>
                </div>
            `;
        }
    });

    // Delegación de eventos para marcar como leído
    document.addEventListener('click', (e) => {
        if (e.target.closest('.mark-as-read')) {
            const button = e.target.closest('.mark-as-read');
            if (button.dataset.id === 'password-notification') {
                markPasswordNotificationAsRead();
                button.closest('.notification-card')?.remove();
                
                // Mostrar estado vacío si no hay más notificaciones
                if (!document.querySelector('.notification-card')) {
                    const container = document.getElementById('notification-list');
                    if (container) {
                        container.innerHTML = `
                            <div class="no-notifications">
                                <i class="ri-notification-off-line" style="font-size: 40px; margin-bottom: 10px;"></i>
                                <p>No tienes notificaciones nuevas</p>
                            </div>
                        `;
                    }
                }
            }
        }
    });
}