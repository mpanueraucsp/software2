/**
 * ICG001
 * Interfaz - Clase InterfazGrafico
 *
 * Propósito:
 * - Gestionar la vista de gráficos del Balance (frontend).
 * - Pedir al backend el resumen de ingresos y gastos por concepto.
 * - Renderizar gráficos usando Chart.js:
 *    (1) Ingresos por concepto (doughnut/circular)
 *    (2) Gastos por concepto (doughnut/circular)
 *    (3) Comparativo (total ingresos vs total gastos) (doughnut/circular)
 *
 * Dependencias:
 * - Variable global `endpoint` (base URL del backend).
 * - Backend: ruta `api/gbalance/traerGraficoIngresos/` que devuelva JSON con:
 *      { ingresos: [...], gastos: [...] }
 * - Chart.js cargado en la página (CDN o bundle).
 * - En el HTML deben existir estos elementos:
 *      <canvas id="chartIngresos"></canvas>
 *      <canvas id="chartGastos"></canvas>
 *      <canvas id="chartComparativo"></canvas>
 *      <div id="no-ingresos" class="no-data"></div>
 *      <div id="no-gastos" class="no-data"></div>
 *      <div id="no-comp" class="no-data"></div>
 */
class InterfazGrafico {
  /**
   * ICG001A
   * Propiedades principales de la clase (estado de sesión/vista).
   * - token: autenticación (si tu backend la exige)
   * - tipoUsuario: rol/perfil (si la vista cambia por permisos)
   * - usuario: usuario seleccionado o actual
   */
  token;       // Token de autenticación
  tipoUsuario; // Rol/perfil del usuario
  usuario;     // Usuario seleccionado / usuario actual

  /**
   * ICG002
   * Constructor
   * - Inicializa el contenedor de charts para poder destruirlos si la vista se re-renderiza.
   * - Asigna eventos base (ej. cambios en selects).
   * - Escucha el resize de la ventana para recalcular tamaños en Chart.js.
   *
   * Nota:
   * - En SPA o vistas reusadas, si NO destruyes los charts anteriores,
   *   se duplican instancias y aparecen bugs/consumo de memoria.
   */
  constructor() {
    /**
     * ICG002A
     * this.charts guarda las instancias creadas por Chart.js:
     * - chartIngresos
     * - chartGastos
     * - chartComparativo
     */
    this.charts = {};

    // ICG002B: Configura listeners generales de la interfaz
    this.asignarEventosBase();

    /**
     * ICG002C
     * Resize: cuando cambia el tamaño de la ventana (responsive),
     * forzamos que Chart.js recalcule el tamaño del canvas.
     */
    window.addEventListener("resize", () => this.recalcularTamanos());
  }

  /**
   * ICG003
   * mostrarPestana
   * - Se llama cuando el usuario abre la pestaña/vista de "Gráficos".
   * - Guarda datos necesarios (token, usuario, tipo) y dispara la consulta al backend.
   *
   * @param {string|number} usuario     ID del usuario que se va a consultar
   * @param {string}        token       token de autenticación
   * @param {string}        tipoUsuario rol/perfil
   */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;
    this.tipoUsuario = tipoUsuario;
    this.usuario = usuario;

    // ICG003A: Llama al método que consulta backend y luego dibuja.
    this.traerGraficoIngreso(this.token, this.usuario);
  }

  /**
   * ICG004
   * traerGraficoIngreso
   * - Construye la URL hacia el endpoint del backend.
   * - Hace fetch() y valida resp.ok para evitar errores al intentar parsear JSON
   *   cuando el servidor devuelve HTML (ej. 404/500).
   * - Si todo sale bien, manda los datos a mostrarImagen().
   *
   * Nota:
   * - Usa encodeURIComponent para evitar problemas con caracteres especiales.
   */
  traerGraficoIngreso(token, usuario){
    const url =
      endpoint +
      `api/gbalance/traerGraficoIngresos/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}`;

    try {
      fetch(url)
        .then(async (resp) => {
          /**
           * ICG004A
           * Validación HTTP:
           * - resp.ok es false si status no está en 200-299.
           * - resp.text() ayuda a depurar (a veces viene HTML o un mensaje).
           */
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 120)}`);
          }
          return resp.json();
        })
        .then(lista => {
          /**
           * ICG004B
           * Cuando llega el JSON:
           * - lista debería tener: { ingresos: [...], gastos: [...] }
           * - requestAnimationFrame asegura que el DOM/layout ya “asentó” antes de dibujar.
           *   (clave en SPA/cuando se monta una vista con grid/flex)
           */
          console.debug("Datos gráfico:", lista);
          requestAnimationFrame(() => this.mostrarImagen(lista));
        })
        .catch(err => {
          // ICG004C: Error de red, de backend o parseo
          console.error("Error:", err);
        });
    } catch (error) {
      /**
       * ICG004D
       * catch del try: errores inesperados (muy raro aquí, pero lo dejamos).
       */
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  /**
   * ICG005
   * mostrarImagen
   * - Recibe el JSON del backend y renderiza los 3 gráficos.
   *
   * Requisitos:
   * - Chart.js cargado (Chart definido)
   * - Existan los canvas con IDs correctos
   *
   * @param {object} lista  JSON del backend con ingresos y gastos
   */
  mostrarImagen(lista){
    // ICG005A: Verifica que Chart.js esté disponible
    if (typeof Chart === "undefined") {
      console.error("Chart.js no está cargado. Revisa que esté incluido (CDN) en la página.");
      return;
    }

    /**
     * ICG005B
     * Normalizamos la entrada:
     * - Si lista.ingresos / lista.gastos no son arrays, usamos [] para evitar errores.
     */
    const ingresos = Array.isArray(lista?.ingresos) ? lista.ingresos : [];
    const gastos   = Array.isArray(lista?.gastos)   ? lista.gastos   : [];

    /**
     * ICG005C
     * Helper: convierte montos a number de forma segura.
     * - Soporta coma decimal (ej. "12,50").
     */
    const toNumber = (v) => {
      const n = Number(String(v ?? "0").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    /**
     * ICG005D
     * Referencias a los canvas HTML.
     * - Chart.js dibuja dentro del canvas.
     */
    const cIng = document.getElementById("chartIngresos");
    const cGas = document.getElementById("chartGastos");
    const cCmp = document.getElementById("chartComparativo");

    // ICG005E: Si no existen, la vista HTML no está correcta.
    if (!cIng || !cGas || !cCmp) {
      console.error("No se encontraron los canvas. Verifica IDs: chartIngresos, chartGastos, chartComparativo");
      return;
    }

    /**
     * ICG005F
     * Destruir charts previos:
     * - Importante en SPA o cuando se vuelve a abrir la pestaña.
     * - destroy() limpia canvas y listeners internos.
     */
    Object.values(this.charts).forEach(ch => ch?.destroy?.());
    this.charts = {};

    /**
     * ICG005G
     * Transformación de datos:
     * - labels: nombres de conceptos
     * - data  : montos por concepto
     *
     * Se asume que el backend envía objetos tipo:
     *  { concepto: "Sueldo", total_monto: 3500 }
     */
    const ingresoLabels = ingresos.map(i => i.concepto);
    const ingresoData   = ingresos.map(i => toNumber(i.total_monto));

    const gastoLabels = gastos.map(g => g.concepto);
    const gastoData   = gastos.map(g => toNumber(g.total_monto));

    /**
     * ICG005H
     * Mensajes "no data" (mostramos/ocultamos según corresponda)
     */
    const noIng = document.getElementById("no-ingresos");
    const noGas = document.getElementById("no-gastos");
    const noCmp = document.getElementById("no-comp");

    if (noIng) noIng.style.display = (ingresos.length === 0) ? "block" : "none";
    if (noGas) noGas.style.display = (gastos.length === 0) ? "block" : "none";

    /**
     * ICG005I
     * 1) Gráfico de INGRESOS (doughnut)
     * - Solo se crea si hay datos.
     * - this.generarColores(n) devuelve n colores para las porciones.
     */
    if (ingresos.length > 0) {
      this.charts.chartIngresos = new Chart(cIng, {
        type: "doughnut",
        data: {
          labels: ingresoLabels,
          datasets: [{
            label: "Ingresos",
            data: ingresoData,
            backgroundColor: this.generarColores(ingresoData.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // permite que el chart use la altura del contenedor
          plugins: { legend: { position: "bottom" } }
        }
      });
    }

    /**
     * ICG005J
     * 2) Gráfico de GASTOS (doughnut)
     */
    if (gastos.length > 0) {
      this.charts.chartGastos = new Chart(cGas, {
        type: "doughnut",
        data: {
          labels: gastoLabels,
          datasets: [{
            label: "Gastos",
            data: gastoData,
            backgroundColor: this.generarColores(gastoData.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    }

    /**
     * ICG005K
     * 3) Comparativo TOTAL (Ingresos vs Gastos)
     * - Suma los montos para comparar solo en 2 porciones.
     */
    const totalIng = ingresoData.reduce((a, b) => a + b, 0);
    const totalGas = gastoData.reduce((a, b) => a + b, 0);

    // Si ambos son 0, no tiene sentido dibujar (no hay comparación real)
    const hayComparacion = (totalIng > 0 || totalGas > 0);
    if (noCmp) noCmp.style.display = hayComparacion ? "none" : "block";

    if (hayComparacion) {
      this.charts.chartComparativo = new Chart(cCmp, {
        type: "doughnut",
        data: {
          labels: ["Ingresos", "Gastos"],
          datasets: [{
            data: [totalIng, totalGas],
            // Colores fijos para comparar: azul (ingresos) vs rojo (gastos)
            backgroundColor: [
              "rgba(59, 130, 246, 0.75)",
              "rgba(239, 68, 68, 0.75)"
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    }

    /**
     * ICG005L
     * Forzar recálculo de tamaño:
     * - Útil cuando la vista se acaba de montar o el grid/flex cambia dimensiones.
     */
    this.recalcularTamanos();
  }

  /**
   * ICG005B
   * recalcularTamanos
   * - Fuerza a Chart.js a recalcular el tamaño del canvas para cada gráfico existente.
   * - Se hace dentro de requestAnimationFrame para esperar al render del navegador.
   *
   * Casos donde ayuda:
   * - Cambios en el layout (grid/flex)
   * - Pestañas ocultas/mostradas
   * - Cambio de tamaño de ventana
   */
  recalcularTamanos() {
    requestAnimationFrame(() => {
      Object.values(this.charts).forEach(ch => {
        if (ch) {
          ch.resize();
          ch.update();
        }
      });
    });
  }

  /**
   * ICG006
   * generarColores
   * - Devuelve un array de colores con longitud n.
   * - Repite una paleta base si hay más elementos que colores base.
   *
   * @param {number} n cantidad de colores requeridos
   * @returns {string[]} lista de colores RGBA
   */
  generarColores(n) {
    const base = [
      'rgba(59, 130, 246, 0.8)',  // azul
      'rgba(16, 185, 129, 0.8)',  // verde
      'rgba(249, 115, 22, 0.8)',  // naranja
      'rgba(239, 68, 68, 0.8)',   // rojo
      'rgba(139, 92, 246, 0.8)',  // morado
      'rgba(234, 179, 8, 0.8)'    // amarillo
    ];
    const colores = [];
    for (let i = 0; i < n; i++) colores.push(base[i % base.length]);
    return colores;
  }

  /**
   * ICG007
   * asignarEventosBase
   * - Aquí se agregan listeners globales para la vista.
   * - Actualmente:
   *   - click: está como placeholder (no hace nada).
   *   - change: si cambia el select con id="usuario", intenta llamar seleccionarUsuario()
   *     (solo si existe en esta clase).
   *
   * Nota:
   * - Esto evita errores si en algún momento el HTML tiene un <select id="usuario">
   *   pero esta clase no implementa seleccionarUsuario.
   */
  asignarEventosBase() {
    // Placeholder: puedes agregar acciones globales en clicks si lo necesitas
    document.addEventListener('click', (event) => {});

    // Si cambia el usuario seleccionado, refrescar los gráficos (si existe el método)
    document.addEventListener('change', (event) => {
      if (event.target.id === 'usuario') {
        if (typeof this.seleccionarUsuario === "function") this.seleccionarUsuario();
      }
    });
  }
}
