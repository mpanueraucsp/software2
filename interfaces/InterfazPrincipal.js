/**
 * ICP001
 * Interfaz - Clase InterfazPrincipal.
 * Propósito: controlar la navegación principal de la app:
 * - Leer token/usuario/tipo desde localStorage
 * - Escuchar clicks del sidebar (nav-item) y cargar pantallas (fetch de HTML)
 * - Inicializar las interfaces de cada módulo (Ingreso, Balance, Configuración, Cuentas)
 * - Marcar visualmente el item activo del sidebar
 */
class InterfazPrincipal {
  usuarioID;    // ID del usuario en sesión (desde localStorage o login)
  token;        // Token de sesión (desde localStorage o login)
  tipoUsuario;  // Tipo de usuario/rol (ej. ADMINISTRADOR)

  /**
   * ICP002
   * Constructor: configura listeners del menú lateral y carga variables de sesión.
   */
  constructor() {
    this.configurarEventos();
  }

  /**
   * ICP003
   * configurarEventos:
   * - Recupera token/tipoUsuario/usuarioID desde localStorage
   * - Asigna eventos click a cada link del sidebar para navegar sin recargar
   */
  configurarEventos() {
    console.debug("inicio");

    // Recupera sesión almacenada
    this.token = localStorage.getItem("token");
    this.tipoUsuario = localStorage.getItem("tipoUsuario");
    this.usuarioID = localStorage.getItem("usuarioID");
    console.debug(this.usuarioID, this.tipoUsuario);

    // Evento click menú (sidebar)
    const enlaces = document.querySelectorAll('.nav-item');
    enlaces.forEach(enlace => {
      enlace.addEventListener('click', (e) => {
        e.preventDefault(); // evita redirección nativa
        const page = enlace.getAttribute('data-page'); // página destino
        this.navegar(page); // enrutar según data-page
      });
    });
  }

  /**
   * ICP004
   * navegar: enrutador simple basado en data-page del sidebar.
   *
   * @param {string} page Identificador de la vista a cargar.
   */
  navegar(page) {
    switch (page) {
      case 'ingreso-diario':
        this.mostrarIngresoDiario();
        break;
      case 'balance':
        this.mostrarBalance();
        break;
      case 'configuracion':
        this.seleccionarConfiguracion();
        break;
      case 'cuentas':
        this.mostrarCuentas();
        break;
      default:
        console.log("Página no reconocida:", page);
    }
  }

  /**
   * ICP005
   * mostrarCuentas:
   * - Carga pages/cuentas.html en <main>
   * - Inicializa InterfazCuentas y muestra la pestaña
   * - Actualiza el sidebar con "cuentas" activo
   */
  mostrarCuentas() {
    var scope = this;

    fetch('../pages/cuentas.html')
      .then(r => r.text())
      .then(html => {
        document.querySelector('main').innerHTML = html;

        // Inicializa módulo Cuentas
        window.uiCuentas = new InterfazCuentas();
        window.uiCuentas.mostrarPestana(this.usuarioID, this.token);

        // Marca sidebar activo
        scope.activarSideBar("cuentas");
      })
      .catch(err => console.error('Error al cargar cuentas:', err));
  }

  /**
   * ICP006
   * seleccionarConfiguracion:
   * - Carga pages/configuracion.html en <main>
   * - Inicializa InterfazConfiguracion
   * - Marca sidebar "configuracion" como activo
   */
  seleccionarConfiguracion(){
    var scope = this;

    fetch('../pages/configuracion.html')
      .then(r => r.text())
      .then(html => {
        document.querySelector('main').innerHTML = html;

        // Inicializa módulo Configuración
        window.uiConfiguracion = new InterfazConfiguracion();
        console.debug(this.usuarioID, this.token);
        window.uiConfiguracion.mostrarPestana(this.usuarioID, this.token);

        // Marca sidebar activo
        scope.activarSideBar("configuracion");
      })
      .catch(err => console.error('Error al cargar configuracion:', err));
  }

  /**
   * ICP007
   * mostrarIngresoDiario:
   * - Carga pages/ingreso_diario.html en <main>
   * - Inicializa InterfazIngreso y muestra la pestaña
   * - Marca sidebar "ingreso-diario" como activo
   */
  mostrarIngresoDiario(){
    var scope = this;

    fetch('../pages/ingreso_diario.html')
      .then(r => r.text())
      .then(html => {
        document.querySelector('main').innerHTML = html;

        // Inicializa módulo Ingreso Diario
        window.uiIngreso = new InterfazIngreso();
        console.debug(this.usuarioID, this.token);
        window.uiIngreso.mostrarPestana(this.usuarioID, this.token);

        // Marca sidebar activo
        scope.activarSideBar("ingreso-diario");
      })
      .catch(err => console.error('Error al cargar ingreso_diario:', err));
  }

  /**
   * ICP008
   * mostrarPantallaPrincipal:
   * - Guarda token/tipoUsuario/usuarioID en localStorage
   * - Redirige a pages/inicio.html (pantalla principal)
   * - Actualiza atributos de la clase
   *
   * @param {string} token Token de sesión
   * @param {string} tipoUsuario Rol/perfil
   * @param {number|string} usuarioID ID del usuario
   */
  mostrarPantallaPrincipal(token, tipoUsuario, usuarioID){
    // Guarda sesión en localStorage
    localStorage.setItem('token', "token");
    localStorage.setItem('tipoUsuario', tipoUsuario);
    localStorage.setItem('usuarioID', usuarioID);

    // Redirige a la pantalla principal
    window.location.href = '../pages/inicio.html';

    console.debug(token, tipoUsuario, usuarioID);

    // Guarda variables también en el objeto
    this.usuarioID = usuarioID;
    this.token = token;
    this.tipoUsuario = tipoUsuario;
  }

  /**
   * ICP009
   * activarSideBar:
   * - Marca visualmente el item actual del sidebar:
   *   - item activo: estrella ★, label uppercase/bold, desc blanca
   *   - item inactivo: estrella ☆, label normal, desc negra
   *
   * @param {string} currentPage valor esperado en data-page del nav-item
   */
  activarSideBar(currentPage) {
    console.debug("entro a activar");

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      console.debug(item);

      item.classList.remove('active');

      if (item.dataset.page === currentPage) {
        item.classList.add('active');

        // Cambiar estrella (☆ -> ★)
        const icon = item.querySelector('.nav-icon');
        if (icon && icon.textContent === '☆') {
          icon.textContent = '★';
        }

        // Estilo label activo
        const label = item.querySelector('.nav-label');
        if (label) {
          label.style.textTransform = 'uppercase';
          label.style.fontWeight = '600';
        }

        // Estilo descripción activa
        const desc = item.querySelector('.nav-desc');
        if (desc) {
          desc.style.color = 'white';
        }
      } else {
        // Estado inactivo
        item.classList.remove('active');

        // Cambiar estrella a vacía
        const icon = item.querySelector('.nav-icon');
        icon.textContent = '☆';

        // Estilo label inactivo
        const label = item.querySelector('.nav-label');
        if (label) {
          label.style.textTransform = 'capitalize';
          label.style.fontWeight = '400';
        }

        // Estilo descripción inactiva
        const desc = item.querySelector('.nav-desc');
        if (desc) {
          desc.style.color = 'black';
        }
      }
    });
  }

  /**
   * ICP010
   * mostrarBalance:
   * - Carga pages/balance.html (sin cache) y lo inyecta en #app-main
   * - Inicializa InterfazBalance y muestra la pestaña
   * - Marca sidebar "balance" como activo
   */
  mostrarBalance() {
    console.debug(this.usuarioID);
    var scope = this;

    fetch('../pages/balance.html?v=' + Date.now(), { cache: 'no-store' })
      .then(r => r.text())
      .then(html => {
        document.querySelector('#app-main').innerHTML = html;

        // Inicializa módulo Balance
        window.uiBalance = new InterfazBalance();
        window.uiBalance.mostrarPestana(this.usuarioID, "token", this.tipoUsuario);

        // Marca sidebar activo
        scope.activarSideBar("balance");
      })
      .catch(err => console.error('Error al cargar balance:', err));
  }
}
