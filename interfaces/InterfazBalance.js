/**
 * IUB001
 * Interfaz - Clase InterfazBalance.
 * Propósito: gestionar la vista de Balance en el front:
 * - Cargar fecha actual
 * - Mostrar combo de usuarios (si es ADMIN)
 * - Consultar balance y movimientos del día
 * - Navegar a Historial y Graficar
 */
class InterfazBalance {
  token;
  tipoUsuario;
  usuario;

  /**
   * IUB002
   * Constructor: inicializa la interfaz y asigna eventos globales de la vista.
   */
  constructor() {
    this.asignarEventosBase();
  }

  /*
    IUB003
    mostrarPestana: inicializa la pestaña de Balance con el usuario/token/tipoUsuario
    y dispara la carga de datos (fecha, combo y balance).
  */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;                 // Token de sesión
    this.tipoUsuario = tipoUsuario;     // Rol/perfil (ADMINISTRADOR o usuario)
    this.usuario = usuario;             // Usuario actual (id o valor usado por API)
    this.colocarFechaActual();          // Coloca fecha del día en el input
    this.mostrarCombo();                // Si es ADMIN, carga combo de usuarios
    this.traerBalance();                // Llama al backend para traer totales y movimientos
  }

  /*
    IUB004
    colocarFechaActual: coloca la fecha actual (YYYY-MM-DD) en el input #fecha.
  */
  colocarFechaActual(){
    const inputFecha = document.getElementById('fecha');
    if (!inputFecha) return;            // Si no existe el input, no hace nada
    const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    inputFecha.value = hoy;
  }

  /*
    IUB005
    mostrarCombo: si el tipo de usuario es ADMINISTRADOR, solicita al servidor el listado
    de usuarios y llena el select #usuario.
  */
  mostrarCombo(){
    console.debug(this.tipoUsuario);

    // Solo los administradores ven el combo de usuarios
    if (this.tipoUsuario=="ADMINISTRADOR"){
      // Endpoint API para listar usuarios
      var url = endpoint+`api/gusuario/mostrarUsuarios/?token=${encodeURIComponent(this.token)}`;
      var scope = this;

      try {
        fetch(url)
        .then(resp => {
          return resp.json(); 
        })
        .then(lista => {
          console.debug(lista);
          scope.llenarComboUsuarios(lista); // Llenar combo con respuesta del servidor
        })
        .catch(err => console.error("Error:", err));

      } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
      }
    }
  }

  /*
    IUB006
    llenarComboUsuarios: llena el select #usuario con la lista recibida desde el servidor.
    - Si es ADMINISTRADOR, agrega una opción "TODOS" con value=0.
  */
  llenarComboUsuarios(lista) {
    const select = document.getElementById('usuario');
    if (!select) return;

    // Limpia opciones anteriores
    select.innerHTML = '';

    // Agrega opción "TODOS" solo para admin
    if (this.tipoUsuario=="ADMINISTRADOR"){
      const option = document.createElement('option');
      option.value = 0;                  // Valor interno (todos)
      option.textContent = "TODOS";      // Texto visible
      select.appendChild(option);
    }

    // Recorre la lista JSON y agrega las opciones
    for (const item of lista) {
      const option = document.createElement('option');
      option.value = item.usuarioID;     // ID del usuario
      option.textContent = item.nombre;  // Nombre visible
      select.appendChild(option);
    }
  }

  /*
    IUB007
    traerBalance: consulta al backend el balance (mensual/anual/diario) y los movimientos del día
    según el usuario seleccionado (admin) o el usuario actual.
  */
  traerBalance(){
      var scope = this;

      console.debug(this.usuario);

      // Toma la fecha del input
      var ofecha = document.getElementById('fecha');
      var fecha = ofecha.value;
      console.debug(fecha);

      // Endpoint API: trae lista de balance + movimientos (JSON)
      var url = endpoint+`api/gbalance/traerBalanceLista/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}&tipoUsuario=${encodeURIComponent(this.tipoUsuario)}&fecha=${encodeURIComponent(fecha)}`;

      try {
        fetch(url)
        .then(resp => {
          return resp.json(); 
        })
        .then(lista => {
          console.debug(lista);
          scope.mostrarDatos(lista); // Renderiza totales y tablas
        })
        .catch(err => console.error("Error:", err));

      } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
      }
  }

  /*
    IUB008
    mostrarDatos: actualiza los totales (mensual/anual) y separa movimientos en ingresos y gastos
    para renderizarlos en tablas.
  */
  mostrarDatos(lista){
    const { listaBalance, listaMovimientos } = lista;

    // --- Actualizar totales principales ---
    document.getElementById("mensual").textContent = listaBalance?.mensual?.toFixed(2) || "0.00";
    document.getElementById("todos-anos").textContent = listaBalance?.anual?.toFixed(2) || "0.00";

    // --- Dividir movimientos por tipo ---
    const ingresos = listaMovimientos.filter(m => m.tipoConcepto === 1);   // Ingresos
    const gastos   = listaMovimientos.filter(m => m.tipoConcepto === -1);  // Gastos

    // --- Llenar listas/tablas ---
    this.llenarTabla("ingresos-list", ingresos);
    this.llenarTabla("gastos-list", gastos);

    // --- Calcular totales para resumen inferior ---
    const totalIngresos = ingresos.reduce((acc, m) => acc + parseFloat(m.monto), 0);
    const totalGastos   = gastos.reduce((acc, m) => acc + parseFloat(m.monto), 0);

    document.getElementById("total-ingresos").textContent = totalIngresos.toFixed(2);
    document.getElementById("total-gastos").textContent   = totalGastos.toFixed(2);
  }

  /*
    IUB009
    llenarTabla: renderiza una lista de movimientos en el contenedor indicado.
    - Si no hay registros, muestra "No hay movimientos".
  */
  llenarTabla(idContenedor, movimientos) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = "";

    // Caso sin movimientos
    if (movimientos.length === 0) {
      contenedor.innerHTML = `<div class="table-row" style="opacity:.6;">No hay movimientos</div>`;
      return;
    }

    // Render de cada movimiento
    for (const m of movimientos) {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <span class="col-fecha">${this.formatearFecha(m.fecha)}</span>
        <span class="col-concepto">${m.concepto}</span>
        <span class="col-monto">${Number(m.monto).toFixed(2)}</span>
      `;
      contenedor.appendChild(row);
    }
  }

  /*
    IUB010
    formatearFecha: convierte 'YYYY-MM-DD' a formato local 'dd/mm/yyyy' (es-PE).
  */
  formatearFecha(fechaStr) {
    const [year, month, day] = fechaStr.split('-');
    const f = new Date(year, month - 1, day);
    return f.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  /*
    IUB011
    seleccionarHistorial: carga la página historial.html dentro de <main> e inicializa InterfazHistorial.
    Usa el usuario seleccionado en el combo (admin) y el token actual.
  */
  seleccionarHistorial(){
    const select = document.getElementById('usuario');
    console.debug(select.value);

    fetch('../pages/historial.html')
    .then(r => r.text())
    .then(html => {
      document.querySelector('main').innerHTML = html;
      window.uiHistorial = new InterfazHistorial();

      // Manda usuario seleccionado (o 0 si es TODOS) y token actual
      window.uiHistorial.mostrarPestana(select.value, this.token);
    })
    .catch(err => console.error('Error al cargar configuracion:', err));
  }

  /*
    IUB012
    seleccionarGraficar: carga graficar.html dentro de <main> e inicializa InterfazGrafico.
    Usa el usuario seleccionado en el combo (admin) y el token actual.
  */
  seleccionarGraficar() {
    const select = document.getElementById('usuario');

    fetch('../pages/graficar.html')
    .then(r => r.text())
    .then(html => {
      document.querySelector('main').innerHTML = html;
      window.uiGrafico = new InterfazGrafico();

      // Manda usuario seleccionado (o 0 si es TODOS) y token actual
      window.uiGrafico.mostrarPestana(select.value, this.token);
    })
    .catch(err => console.error('Error al cargar configuracion:', err));

    return true;
  }

  /*
    IUB013
    Operation1: método placeholder (sin implementación).
  */
  Operation1(){
    // método placeholder
  }

  /*
    IUB014
    seleccionarUsuario: se ejecuta cuando cambia el select #usuario (solo imprime en consola).
  */
  seleccionarUsuario(){
    const select = document.getElementById('usuario');
    if (!select) return;
    console.debug('Usuario seleccionado:', select.value);
  }

  /*
    IUB015
    asignarEventosBase: asigna listeners globales para:
    - Botón graficar (.btn-graph)
    - Botón historial (.btn-history)
    - Botón filtrar balance (.btn-filterbalance)
    - Cambio en select #usuario
  */
  asignarEventosBase() {
    // Clicks en toda la página; filtramos por clases
    document.addEventListener('click', (event) => {
      const btnGraph = event.target.closest('.btn-graph');
      if (btnGraph) {
        this.seleccionarGraficar();
        return;
      }

      const btnHist = event.target.closest('.btn-history');
      if (btnHist) {
        this.seleccionarHistorial();
        return;
      }

      const btnFilter = event.target.closest('.btn-filterbalance');
      if (btnFilter) {
        this.traerBalance(); // Reconsulta balance usando fecha/usuario seleccionados
        return;
      }
    });

    // Cambios en el combo de usuario
    document.addEventListener('change', (event) => {
      if (event.target.id === 'usuario') {
        this.seleccionarUsuario();
      }
    });
  }

}
