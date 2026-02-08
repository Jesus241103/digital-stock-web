/**
 * Layout Component
 * Maneja la renderización del sidebar, menú móvil y estado del usuario
 */

const Layout = {
    /**
     * Inicializar layout
     */
    init: function () {
        this.renderSidebar();
        this.setupMobileMenu();
        this.setupUserInfo();
        this.highlightCurrentPage();
    },

    /**
     * Renderizar el Sidebar HTML
     */
    renderSidebar: function () {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;

        const sidebarHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <div class="sidebar-logo-icon">
                        <i class="fas fa-boxes-stacked"></i>
                    </div>
                    <div class="sidebar-logo-text">Digital <span>Stock</span></div>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">Principal</div>
                    <a href="dashboard.html" class="nav-item" data-page="dashboard.html">
                        <i class="fas fa-chart-pie"></i>
                        <span>Dashboard</span>
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Inventario</div>
                    <a href="products.html" class="nav-item" data-page="products.html">
                        <i class="fas fa-box"></i>
                        <span>Productos</span>
                    </a>
                    <a href="purchases.html" class="nav-item" data-page="purchases.html">
                        <i class="fas fa-arrow-down"></i>
                        <span>Entradas</span>
                    </a>
                    <a href="sales.html" class="nav-item" data-page="sales.html">
                        <i class="fas fa-arrow-up"></i>
                        <span>Salidas</span>
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Gestión</div>
                    <a href="clients.html" class="nav-item" data-page="clients.html">
                        <i class="fas fa-users"></i>
                        <span>Clientes</span>
                    </a>
                    <a href="providers.html" class="nav-item" data-page="providers.html">
                        <i class="fas fa-truck"></i>
                        <span>Proveedores</span>
                    </a>
                </div>

                <div class="nav-section" id="adminSection" style="display: none;">
                    <div class="nav-section-title">Administración</div>
                    <a href="users.html" class="nav-item" data-page="users.html">
                        <i class="fas fa-user-cog"></i>
                        <span>Usuarios</span>
                    </a>
                    <a href="logs.html" class="nav-item" data-page="logs.html">
                        <i class="fas fa-history"></i>
                        <span>Bitácora</span>
                    </a>
                    <a href="reports.html" class="nav-item" data-page="reports.html">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <span>Reportes</span>
                    </a>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="user-avatar" id="userAvatar">??</div>
                    <div class="user-info">
                        <div class="user-name" id="userName">Usuario</div>
                        <div class="user-role" id="userRole">user</div>
                    </div>
                    <button class="user-logout" onclick="API.logout()" title="Cerrar sesión">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </aside>
        
        <!-- Overlay para móvil -->
        <div class="mobile-overlay" id="mobileOverlay"></div>
        `;

        // Insertar al inicio del contenedor
        appContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
    },

    /**
     * Configurar eventos del menú móvil
     */
    setupMobileMenu: function () {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');
        const overlay = document.getElementById('mobileOverlay');

        if (menuBtn && sidebar && overlay) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
    },

    /**
     * Mostrar información del usuario
     */
    setupUserInfo: function () {
        // Verificar autenticación globalmente
        if (typeof API !== 'undefined' && API.isAuthenticated()) {
            const user = API.getUser();
            if (user) {
                const userNameEl = document.getElementById('userName');
                const userRoleEl = document.getElementById('userRole');
                const userAvatarEl = document.getElementById('userAvatar');
                const adminSection = document.getElementById('adminSection');

                if (userNameEl) userNameEl.textContent = user.nombre || 'Usuario';
                if (userRoleEl) userRoleEl.textContent = user.rol || 'user';
                if (userAvatarEl) userAvatarEl.textContent = Utils.getInitials(user.nombre);

                // Mostrar sección admin si corresponde
                if (adminSection && user.rol === 'admin') {
                    adminSection.style.display = 'block';
                }
            }
        } else if (window.location.pathname.includes('/pages/') && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
            // Redirigir si no está autenticado y está en una página interna
            window.location.href = 'login.html';
        }
    },

    /**
     * Resaltar página actual en el menú
     */
    highlightCurrentPage: function () {
        const path = window.location.pathname;
        const page = path.split('/').pop();

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Layout.init();
});
