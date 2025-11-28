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
 *
 * Nota:
 * - Se eliminó el botón "Atrás" (no hay lógica de navegación en este JS).
 */
class InterfazGrafico {
  /**
   * ICG001A
   * Estado de sesión/vista.
   */
  token;       // Token de autenticación
  tipoUsuario; // Rol/perfil del usuario
  usuario;     // Usuario seleccionado / usuario actual

  /**
   * ICG002
   * Constructor
   * - Inicializa el contenedor de charts.
   * - Asigna eventos base (si en el futuro se agregan controles).
   * - Escucha resize para que Chart.js reajuste tamaños.
   */
  constructor() {
    /** ICG002A: Instancias Chart.js */
    this.charts = {};

    /** ICG002B: Listeners generales de la interfaz */
    this.asignarEventosBase();

    /** ICG002C: Recalcular tamaños en responsive */
    window.addEventListener("resize", () => this.recalcularTamanos());
  }

  /**
   * ICG003
   * mostrarPestana
   * - Se llama al abrir la vista "Gráficos".
   * - Guarda token/usuario/tipoUsuario y consulta al backend.
   *
   * @param {string|number} usuario     ID del usuario a consultar
   * @param {string}        token       token de autenticación
   * @param {string}        tipoUsuario rol/perfil
   */
  mostrarPestana(usuario, token, tipoUsuario) {
    this.token = token;
    this.tipoUsuario = tipoUsuario;
    this.usuario = usuario;

    // ICG003A: Consulta backend y luego dibuja
    this.traerGraficoIngreso(this.token, this.usuario);
  }

  /**
   * ICG004
   * traerGraficoIngreso
   * - Construye URL hacia el endpoint del backend.
   * - Hace fetch() y valida resp.ok antes de parsear JSON.
   * - Si todo sale bien, manda los datos a mostrarImagen().
   *
   * @param {string} token
   * @param {string|number} usuario
   */
  traerGraficoIngreso(token, usuario) {
    const url =
      endpoint +
      `api/gbalance/traerGraficoIngresos/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}`;

    try {
      fetch(url)
        .then(async (resp) => {
          // ICG004A: Validación HTTP (evita parsear HTML como JSON)
          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`HTTP ${resp.status} - ${txt.slice(0, 120)}`);
          }
          return resp.json();
        })
        .then((lista) => {
          // ICG004B: Espera al layout antes de dibujar (útil en SPA / grid)
          console.debug("Datos gráfico:", lista);
          requestAnimationFrame(() => this.mostrarImagen(lista));
        })
        .catch((err) => {
          // ICG004C: Error de red/backend/parseo
          console.error("Error:", err);
        });
    } catch (error) {
      // ICG004D: Error inesperado
      console.error("Error:", error);
      alert("No se pudo conectar con el servidor.");
    }
  }

  /**
   * ICG005
   * mostrarImagen
   * - Recibe el JSON del backend y renderiza los 3 gráficos.
   *
   * @param {object} lista JSON del backend con ingresos y gastos
   */
  mostrarImagen(lista) {
    // ICG005A: Verifica Chart.js
    if (typeof Chart === "undefined") {
      console.error("Chart.js no está cargado. Revisa que esté incluido (CDN) en la página.");
      return;
    }

    // ICG005B: Normaliza entradas
    const ingresos = Array.isArray(lista?.ingresos) ? lista.ingresos : [];
    const gastos = Array.isArray(lista?.gastos) ? lista.gastos : [];

    // ICG005C: Convierte montos a number de forma segura (soporta coma decimal)
    const toNumber = (v) => {
      const n = Number(String(v ?? "0").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    // ICG005D: Canvas requeridos por la vista
    const cIng = document.getElementById("chartIngresos");
    const cGas = document.getElementById("chartGastos");
    const cCmp = document.getElementById("chartComparativo");

    if (!cIng || !cGas || !cCmp) {
      console.error("No se encontraron los canvas. Verifica IDs: chartIngresos, chartGastos, chartComparativo");
      return;
    }

    // ICG005E: Destruye charts previos para evitar duplicados/mem leaks
    Object.values(this.charts).forEach((ch) => ch?.destroy?.());
    this.charts = {};

    // ICG005F: Mapea datos del backend a labels/data para Chart.js
    const ingresoLabels = ingresos.map((i) => i.concepto);
    const ingresoData = ingresos.map((i) => toNumber(i.total_monto));

    const gastoLabels = gastos.map((g) => g.concepto);
    const gastoData = gastos.map((g) => toNumber(g.total_monto));

    // ICG005G: Mensajes “sin datos”
    const noIng = document.getElementById("no-ingresos");
    const noGas = document.getElementById("no-gastos");
    const noCmp = document.getElementById("no-comp");

    if (noIng) noIng.style.display = ingresos.length === 0 ? "block" : "none";
    if (noGas) noGas.style.display = gastos.length === 0 ? "block" : "none";

    // ICG005H: 1) Gráfico INGRESOS
    if (ingresos.length > 0) {
      this.charts.chartIngresos = new Chart(cIng, {
        type: "doughnut",
        data: {
          labels: ingresoLabels,
          datasets: [
            {
              label: "Ingresos",
              data: ingresoData,
              backgroundColor: this.generarColores(ingresoData.length),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }

    // ICG005I: 2) Gráfico GASTOS
    if (gastos.length > 0) {
      this.charts.chartGastos = new Chart(cGas, {
        type: "doughnut",
        data: {
          labels: gastoLabels,
          datasets: [
            {
              label: "Gastos",
              data: gastoData,
              backgroundColor: this.generarColores(gastoData.length),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }

    // ICG005J: 3) Comparativo total (Ingresos vs Gastos)
    const totalIng = ingresoData.reduce((a, b) => a + b, 0);
    const totalGas = gastoData.reduce((a, b) => a + b, 0);

    const hayComparacion = totalIng > 0 || totalGas > 0;
    if (noCmp) noCmp.style.display = hayComparacion ? "none" : "block";

    if (hayComparacion) {
      this.charts.chartComparativo = new Chart(cCmp, {
        type: "doughnut",
        data: {
          labels: ["Ingresos", "Gastos"],
          datasets: [
            {
              data: [totalIng, totalGas],
              backgroundColor: ["rgba(59, 130, 246, 0.75)", "rgba(239, 68, 68, 0.75)"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }

    // ICG005K: Ajuste final de tamaños
    this.recalcularTamanos();
  }

  /**
   * ICG006
   * recalcularTamanos
   * - Fuerza a Chart.js a recalcular tamaño del canvas para cada chart.
   */
  recalcularTamanos() {
    requestAnimationFrame(() => {
      Object.values(this.charts).forEach((ch) => {
        if (ch) {
          ch.resize();
          ch.update();
        }
      });
    });
  }

  /**
   * ICG007
   * generarColores
   * - Devuelve un array de colores con longitud n.
   *
   * @param {number} n cantidad de colores requeridos
   * @returns {string[]} lista de colores RGBA
   */
  generarColores(n) {
    const base = [
      "rgba(59, 130, 246, 0.8)",  // azul
      "rgba(16, 185, 129, 0.8)",  // verde
      "rgba(249, 115, 22, 0.8)",  // naranja
      "rgba(239, 68, 68, 0.8)",   // rojo
      "rgba(139, 92, 246, 0.8)",  // morado
      "rgba(234, 179, 8, 0.8)",   // amarillo
    ];

    const colores = [];
    for (let i = 0; i < n; i++) colores.push(base[i % base.length]);
    return colores;
  }

  /**
   * ICG008
   * asignarEventosBase
   * - Listeners globales mínimos.
   * - Mantiene el hook de "usuario" por si existe un <select id="usuario"> en el futuro.
   */
  asignarEventosBase() {
    document.addEventListener("change", (event) => {
      if (event.target.id === "usuario") {
        if (typeof this.seleccionarUsuario === "function") this.seleccionarUsuario();
      }
    });
  }
}
