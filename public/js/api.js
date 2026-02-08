/**
 * Cliente API - Digital Stock Web
 * 
 * Módulo para comunicación con el servidor backend.
 * Maneja todas las peticiones HTTP y autenticación.
 */

if (!window.API) {
    window.API = {
        baseUrl: '/api',

        /**
         * Obtiene el token JWT almacenado
         * @returns {string|null} Token JWT o null
         */
        getToken() {
            return localStorage.getItem('token');
        },

        /**
         * Guarda el token JWT
         * @param {string} token - Token JWT
         */
        setToken(token) {
            localStorage.setItem('token', token);
        },

        /**
         * Elimina el token y datos de sesión
         */
        clearSession() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },

        /**
         * Obtiene los datos del usuario actual
         * @returns {Object|null} Datos del usuario
         */
        getUser() {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        },

        /**
         * Guarda los datos del usuario
         * @param {Object} user - Datos del usuario
         */
        setUser(user) {
            localStorage.setItem('user', JSON.stringify(user));
        },

        /**
         * Verifica si el usuario está autenticado
         * @returns {boolean}
         */
        isAuthenticated() {
            return !!this.getToken();
        },

        /**
         * Verifica si el usuario es admin
         * @returns {boolean}
         */
        isAdmin() {
            const user = this.getUser();
            return user && user.rol === 'admin';
        },

        /**
         * Construye los headers para las peticiones
         * @returns {Object} Headers
         */
        getHeaders() {
            const headers = {
                'Content-Type': 'application/json'
            };

            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            return headers;
        },

        /**
         * Realiza una petición al API
         * @param {string} endpoint - Endpoint del API
         * @param {Object} options - Opciones de fetch
         * @returns {Promise<Object>} Respuesta del servidor
         */
        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;

            const config = {
                headers: this.getHeaders(),
                ...options
            };

            // Mostrar loader global (si existe Utils y no se solicitó omitir)
            if (window.Utils && !options.skipLoader) window.Utils.showLoading();

            try {
                const response = await fetch(url, config);
                const data = await response.json();

                // Si el token expiró, redirigir a login
                if (response.status === 401) {
                    this.clearSession();
                    window.location.href = '/pages/login.html';
                    return { success: false, message: 'Sesión expirada' };
                }

                return data;
            } catch (error) {
                console.error('Error en petición API:', error);
                return {
                    success: false,
                    message: 'Error de conexión con el servidor'
                };
            } finally {
                // Ocultar loader global
                if (window.Utils && !options.skipLoader) window.Utils.hideLoading();
            }
        },

        /**
         * Petición GET
         * @param {string} endpoint - Endpoint
         * @param {Object} params - Parámetros de consulta
         */
        async get(endpoint, params = {}) {
            // Construir query string
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `${endpoint}?${queryString}` : endpoint;

            return this.request(url, { method: 'GET', ...params });
        },

        /**
         * Petición POST
         * @param {string} endpoint - Endpoint
         * @param {Object} body - Cuerpo de la petición
         */
        async post(endpoint, body = {}) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        },

        /**
         * Petición PUT
         * @param {string} endpoint - Endpoint
         * @param {Object} body - Cuerpo de la petición
         */
        async put(endpoint, body = {}) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        },

        /**
         * Petición DELETE
         * @param {string} endpoint - Endpoint
         */
        async delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        },

        // =========================================
        // MÉTODOS DE AUTENTICACIÓN
        // =========================================

        /**
         * Iniciar sesión
         * @param {number} cedula - Cédula del usuario
         * @param {string} clave - Contraseña
         */
        async login(cedula, clave) {
            const result = await this.post('/auth/login', { cedula, clave });

            if (result.success) {
                this.setToken(result.token);
                this.setUser(result.user);
            }

            return result;
        },

        /**
         * Registrar usuario
         * @param {Object} userData - Datos del usuario
         */
        async register(userData) {
            return this.post('/auth/register', userData);
        },

        /**
         * Cerrar sesión
         */
        logout() {
            this.clearSession();
            window.location.href = '/pages/login.html';
        },

        // =========================================
        // MÉTODOS DE PRODUCTOS
        // =========================================

        products: {
            getAll: (params) => API.get('/products', params),
            getByCode: (codigo) => API.get(`/products/${codigo}`),
            search: (q) => API.get('/products/search', { q }),
            create: (data) => API.post('/products', data),
            update: (codigo, data) => API.put(`/products/${codigo}`, data),
            delete: (codigo) => API.delete(`/products/${codigo}`),
            count: () => API.get('/products/count'),
            getInventoryValue: () => API.get('/products/inventory-value'),
            getLowStock: () => API.get('/products/low-stock')
        },

        // =========================================
        // MÉTODOS DE CLIENTES
        // =========================================

        clients: {
            getAll: (params) => API.get('/clients', params),
            getByCedula: (cedula) => API.get(`/clients/${cedula}`),
            search: (q) => API.get('/clients/search', { q }),
            create: (data) => API.post('/clients', data),
            update: (cedula, data) => API.put(`/clients/${cedula}`, data),
            delete: (cedula) => API.delete(`/clients/${cedula}`),
            count: () => API.get('/clients/count')
        },

        // =========================================
        // MÉTODOS DE PROVEEDORES
        // =========================================

        providers: {
            getAll: (params) => API.get('/providers', params),
            getByCode: (codigo) => API.get(`/providers/${codigo}`),
            search: (q) => API.get('/providers/search', { q }),
            create: (data) => API.post('/providers', data),
            update: (codigo, data) => API.put(`/providers/${codigo}`, data),
            delete: (codigo) => API.delete(`/providers/${codigo}`),
            count: () => API.get('/providers/count')
        },

        // =========================================
        // MÉTODOS DE USUARIOS
        // =========================================

        users: {
            getAll: () => API.get('/users'),
            getByCedula: (cedula) => API.get(`/users/${cedula}`),
            update: (cedula, data) => API.put(`/users/${cedula}`, data),
            delete: (cedula) => API.delete(`/users/${cedula}`),
            count: () => API.get('/users/count')
        },

        // =========================================
        // MÉTODOS DE COMPRAS
        // =========================================

        purchases: {
            getAll: (params) => API.get('/purchases', params),
            getById: (id) => API.get(`/purchases/${id}`),
            create: (data) => API.post('/purchases', data),
            count: () => API.get('/purchases/count')
        },

        // =========================================
        // MÉTODOS DE VENTAS
        // =========================================

        sales: {
            getAll: (params) => API.get('/sales', params),
            getById: (id) => API.get(`/sales/${id}`),
            create: (data) => API.post('/sales', data),
            count: () => API.get('/sales/count')
        },

        // =========================================
        // MÉTODOS DE REPORTES
        // =========================================

        reports: {
            getDashboard: () => API.get('/reports/dashboard'),
            getCharts: (params) => API.get('/reports/charts', params),
            getMonthly: (month, year) => API.get(`/reports/monthly/${month}`, { year }),
            getBiweekly: (month, year) => API.get(`/reports/biweekly/${month}`, { year })
        },

        // =========================================
        // MÉTODOS DE BITÁCORA
        // =========================================

        logs: {
            getAll: (params) => API.get('/logs', params),
            getActions: () => API.get('/logs/actions'),
            create: (accion) => API.post('/logs', { accion })
        }
    };

    // Exportar para uso global
    // window.API ya fue asignado al inicio
}
