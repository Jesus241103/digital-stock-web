/**
 * Utilidades JavaScript - Digital Stock Web
 * 
 * Funciones auxiliares reutilizables para toda la aplicación.
 */

if (!window.Utils) {
    const Utils = {
        // =========================================
        // FORMATEO DE DATOS
        // =========================================

        /**
         * Formatea un número como moneda
         * @param {number} value - Valor numérico
         * @param {string} currency - Símbolo de moneda
         * @returns {string} Valor formateado
         */
        formatCurrency(value, currency = '$') {
            if (isNaN(value)) return `${currency}0.00`;
            return `${currency}${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        },

        /**
         * Formatea una fecha
         * @param {string|Date} date - Fecha
         * @param {string} format - Formato: 'short', 'long', 'input'
         * @returns {string} Fecha formateada
         */
        formatDate(date, format = 'short') {
            if (!date) return '-';

            const d = new Date(date);

            if (format === 'input') {
                return d.toISOString().split('T')[0];
            }

            const options = format === 'long'
                ? { year: 'numeric', month: 'long', day: 'numeric' }
                : { year: 'numeric', month: '2-digit', day: '2-digit' };

            return d.toLocaleDateString('es-VE', options);
        },

        /**
         * Formatea un número grande de forma abreviada
         * @param {number} num - Número
         * @returns {string} Número abreviado
         */
        formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        },

        // =========================================
        // LOADING GLOBAL
        // =========================================

        showLoading() {
            let loader = document.getElementById('globalLoader');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.innerHTML = '<div class="spinner"></div>';
                document.body.appendChild(loader);
            }
            loader.style.display = 'flex';
            // Forzar reflow
            loader.offsetHeight;
            loader.classList.add('visible');
        },

        hideLoading() {
            const loader = document.getElementById('globalLoader');
            if (loader) {
                loader.classList.remove('visible');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }
        },

        // =========================================
        // VALIDACIONES
        // =========================================

        /**
         * Valida una cédula (6-9 dígitos)
         */
        validateCedula(value) {
            const cedula = value.toString().trim();
            if (!/^\d{6,9}$/.test(cedula)) {
                return { valid: false, message: 'La cédula debe tener entre 6 y 9 dígitos' };
            }
            return { valid: true };
        },

        /**
         * Valida un nombre (solo letras y espacios)
         */
        validateName(value) {
            const name = value.trim();
            if (name.length < 3 || name.length > 50) {
                return { valid: false, message: 'El nombre debe tener entre 3 y 50 caracteres' };
            }
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
                return { valid: false, message: 'El nombre solo puede contener letras' };
            }
            return { valid: true };
        },

        /**
         * Valida un teléfono (11 dígitos)
         */
        validatePhone(value) {
            const phone = value.replace(/\D/g, '');
            if (phone.length !== 11) {
                return { valid: false, message: 'El teléfono debe tener 11 dígitos' };
            }
            return { valid: true };
        },

        /**
         * Valida una contraseña (mínimo 5 caracteres)
         */
        validatePassword(value) {
            if (value.length < 5) {
                return { valid: false, message: 'La contraseña debe tener al menos 5 caracteres' };
            }
            return { valid: true };
        },

        /**
         * Valida un código de producto (6 dígitos)
         */
        validateProductCode(value) {
            if (!/^\d{6}$/.test(value)) {
                return { valid: false, message: 'El código debe ser de 6 dígitos' };
            }
            return { valid: true };
        },

        /**
         * Valida un precio (número positivo)
         */
        validatePrice(value) {
            const price = parseFloat(value);
            if (isNaN(price) || price <= 0) {
                return { valid: false, message: 'El precio debe ser mayor a 0' };
            }
            return { valid: true };
        },

        // =========================================
        // NOTIFICACIONES TOAST
        // =========================================

        /**
         * Muestra una notificación toast
         * @param {string} message - Mensaje
         * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
         * @param {number} duration - Duración en ms
         */
        toast(message, type = 'info', duration = 4000) {
            // Crear contenedor si no existe
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
            }

            // Iconos por tipo
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-times-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };

            // Crear toast
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

            container.appendChild(toast);

            // Mostrar con animación
            setTimeout(() => toast.classList.add('show'), 10);

            // Cerrar al hacer click
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            });

            // Auto-cerrar
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        },

        // Métodos de conveniencia para toast
        success(msg) { this.toast(msg, 'success'); },
        error(msg) { this.toast(msg, 'error'); },
        warning(msg) { this.toast(msg, 'warning'); },
        info(msg) { this.toast(msg, 'info'); },

        // =========================================
        // MODALES
        // =========================================

        /**
         * Abre un modal
         * @param {string} modalId - ID del modal
         */
        openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },

        /**
         * Cierra un modal
         * @param {string} modalId - ID del modal
         */
        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },

        /**
         * Muestra un diálogo de confirmación
         * @param {string} message - Mensaje
         * @param {Function} onConfirm - Callback al confirmar
         * @param {string} confirmText - Texto del botón confirmar
         */
        confirm(message, onConfirm, confirmText = 'Confirmar') {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.innerHTML = `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">Confirmar</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                    <button class="btn btn-danger" id="modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            // Event listeners
            overlay.querySelector('#modal-cancel').addEventListener('click', () => {
                overlay.remove();
                document.body.style.overflow = '';
            });

            overlay.querySelector('#modal-confirm').addEventListener('click', () => {
                overlay.remove();
                document.body.style.overflow = '';
                onConfirm();
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    document.body.style.overflow = '';
                }
            });
        },

        // =========================================
        // AUXILIARES
        // =========================================

        /**
         * Debounce para evitar llamadas excesivas
         * @param {Function} func - Función a ejecutar
         * @param {number} wait - Tiempo de espera en ms
         */
        debounce(func, wait = 300) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Obtiene parámetros de consulta de la URL
         * @param {string} param - Nombre del parámetro
         */
        getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        },

        /**
         * Escapa HTML para prevenir XSS
         * @param {string} text - Texto a escapar
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Genera las iniciales de un nombre
         * @param {string} name - Nombre completo
         */
        getInitials(name) {
            if (!name) return '??';
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        },

        /**
         * Obtiene el nombre del mes
         * @param {number} month - Número del mes (1-12)
         */
        getMonthName(month) {
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            return months[month - 1] || '';
        }
    };

    // Exportar para uso global
    window.Utils = Utils;
}
