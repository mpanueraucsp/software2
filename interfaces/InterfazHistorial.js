/**
 * ICH001
 * Interfaz - Clase InterfazHistorial.
 * Propósito: gestionar la vista de Historial:
 * - Colocar rango de fechas por defecto (inicio de mes → hoy)
 * - Consultar historial al backend (por usuario y rango)
 * - Renderizar tabla de movimientos y total acumulado
 */
class InterfazHistorial {
  token;       // Token de autenticación
  tipoUsuario; // Rol/perfil del usuario
  usuario;     // Usuario seleccionado / usuario actual

  /**
   * ICH002
   * Constructor: inicializa la interfaz y asigna eventos base.
   */
  constructor() {
    this.asignarEventosBase();
  }

  /*
    ICH003
    mostrarPestana: inicializa la pestaña de Historial con usuario/token/tipoUsuario.
    - Coloca fechas por defecto
    - Trae el historial con el rango inicial
  */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;              // Guarda token
    this.tipoUsuario = tipoUsuario;  // Guarda rol
    this.usuario = usuario;          // Guarda usuario objetivo
    this.colocarFechaActual();       // Setea rango de fechas por defecto
    this.traerHistorial();           // Consulta historial al backend
  }

  /*
    ICH004
    colocarFechaActual: llena los inputs de fechas (inicio y fin) con:
    - fecha-inicio = primer día del mes actual
    - fecha-fin    = hoy
  */
  colocarFechaActual(){
    const inputFechaInicio = document.getElementById('fecha-inicio');
    const inputFechaFin = document.getElementById('fecha-fin');

    if (!inputFechaInicio || !inputFechaFin) return;

    // Obtener fecha actual
    const hoy = new Date();

    // Primer día del mes actual (YYYY-MM-DD)
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    // Fecha de hoy (YYYY-MM-DD)
    const hoyFormateado = hoy.toISOString().split('T')[0];

    // Asignar valores por defecto
    inputFechaInicio.value = primerDiaMes;
    inputFechaFin.value = hoyFormateado;
  }

  /*
    ICH005
    traerHistorial: consulta al backend el historial de movimientos según:
    - usuarioID (this.usuario)
    - fechainicio (#fecha-inicio)
    - fechafin    (#fecha-fin)
    Al recibir la respuesta, renderiza la tabla.
  */
  traerHistorial(){
      var scope = this;

      console.debug(this.usuario);

      // Tomar fechas del DOM
      var ofechainicio = document.getElementById('fecha-inicio');
      var ofechafin = document.getElementById('fecha-fin');
      var fechainicio = ofechainicio.value;
      var fechafin = ofechafin.value;

      // Endpoint API: gbalance/traerHistorial
      var url = endpoint+`api/gbalance/traerHistorial/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}&fechainicio=${encodeURIComponent(fechainicio)}&fechafin=${encodeURIComponent(fechafin)}`;

      try {
        fetch(url)
        .then(resp => {
          return resp.json();
        })
        .then(lista => {
          console.debug(lista);
          scope.mostrarDatosHistorial(lista); // Renderiza tabla y totales
        })
        .catch(err => console.error("Error:", err));

      } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
      }
  }

  /*
    ICH006
    mostrarDatosHistorial: renderiza la tabla del historial usando data.lista.
    - Si no hay resultados, muestra "Sin resultados"
    - Calcula total acumulado (tipoConcepto * monto)
    - Actualiza #text-total y #title-movimientos
  */
  mostrarDatosHistorial(data){
      const tbody = document.querySelector(".history-table tbody");

      // Limpia el contenido actual
      tbody.innerHTML = "";

      // Si no hay datos
      if (!data.lista || data.lista.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="6" style="text-align:center;">Sin resultados</td></tr>
        `;
        return;
      }

      var total = 0.00;

      data.lista.forEach(item => {
            // Formateo de fecha a DD/MM/YYYY
            const fecha = this.formatearFechaYYYYMMDD(item.fecha);

            // Conversión de tipo (Ingreso/Gasto)
            const tipoTexto = this.convertirTipo(item.tipoconconcepto);

            // Acumula total (ingreso suma, gasto resta)
            total += item.tipoconconcepto * item.monto;

            // Crear fila de tabla
            const tr = document.createElement("tr");

            tr.innerHTML = `
              <td>${item.id}</td>
              <td>${fecha}</td>
              <td>${item.concepto}</td>
              <td>${tipoTexto}</td>
              <td>${item.usuario}</td>
              <td>${parseFloat(item.monto).toFixed(2)}</td>
        `;

        tbody.appendChild(tr);
      });

      // Actualizar total en input #text-total
      var oTotal = document.getElementById('text-total');
      console.debug(oTotal, total);
      oTotal.value = total;

      // Actualizar contador de movimientos en el título
      var oMovimientos = document.getElementById('title-movimientos');
      oMovimientos.innerHTML = data.lista.length+" MOVIMIENTOS";
  }

  /*
    ICH007
    formatearFechaYYYYMMDD: convierte YYYY-MM-DD a DD/MM/YYYY.
  */
  formatearFechaYYYYMMDD(f) {
      const partes = f.split("-"); // [YYYY, MM, DD]
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /*
    ICH008
    convertirPeriodicidad: convierte un código de periodicidad a texto.
    Nota: actualmente no se utiliza en el render (se mantiene por utilidad).
  */
  convertirPeriodicidad(valor) {
      switch (valor) {
        case "1": return "Diario";
        case "2": return "Semanal";
        case "3": return "Mensual";
        case "4": return "Anual";
        default: return "Sin definir";
      }
  }

  /*
    ICH009
    convertirTipo: convierte tipoconconcepto (1 / -1) a texto (Ingreso / Gasto).
  */
  convertirTipo(valor) {
      switch (valor) {
        case "1": return "Ingreso";
        case "-1": return "Gasto";
        default: return "Sin definir";
      }
  }

  /*
    ICH010
    asignarEventosBase: asigna listeners globales:
    - Click en .btn-filter: vuelve a consultar historial con el rango actual
    - Change en #usuario: llama a seleccionarUsuario() (nota: no está definido aquí)
  */
  asignarEventosBase() {
    // Clicks en toda la página; filtramos por clases
    document.addEventListener('click', (event) => {
      const btnHist = event.target.closest('.btn-filter');
      if (btnHist) {
        this.traerHistorial(); // Refresca historial con filtros actuales
        return;
      }
    });

    // Cambios en el combo de usuario
    document.addEventListener('change', (event) => {
      if (event.target.id === 'usuario') {
        this.seleccionarUsuario(); // Nota: este método no está definido en este archivo
      }
    });
  }

}
