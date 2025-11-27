/**
 * ICG001
 * Interfaz - Clase InterfazGrafico.
 * Propósito: gestionar la vista de Gráficos:
 * - Consultar al backend el resumen de ingresos y gastos por concepto
 * - Renderizar gráficos usando Chart.js
 *   (1) Ingresos por concepto (circular)
 *   (2) Gastos por concepto (circular)
 *   (3) Comparativo Ingresos vs Gastos (circular: total vs total)
 */
class InterfazGrafico {
  token;       // Token de autenticación
  tipoUsuario; // Rol/perfil del usuario
  usuario;     // Usuario seleccionado / usuario actual

  /**
   * ICG002
   * Constructor: inicializa la interfaz y asigna eventos base.
   * Además crea un contenedor para destruir gráficos previos si se reabre la vista.
   */
  constructor() {
    this.charts = {}; // { chartIngresos, chartGastos, chartComparativo }
    this.asignarEventosBase();
  }

  /*
    ICG003
    mostrarPestana: inicializa la pestaña de Gráficos con usuario/token/tipoUsuario
    y dispara la consulta al backend para traer resumen de ingresos/gastos.
  */
  mostrarPestana(usuario, token, tipoUsuario){
    this.token = token;
    this.tipoUsuario = tipoUsuario;
    this.usuario = usuario;
    this.traerGraficoIngreso(this.token, this.usuario);
  }

  /*
    ICG004
    traerGraficoIngreso: consulta al backend el resumen (ingresos y gastos) para graficar.
  */
  traerGraficoIngreso(token, usuario){
    var url = endpoint+`api/gbalance/traerGraficoIngresos/?token=${encodeURIComponent(this.token)}&usuarioID=${encodeURIComponent(this.usuario)}`;

    try {
      fetch(url)
      .then(resp => resp.json())
      .then(lista => {
        console.debug("Datos gráfico:", lista);
        this.mostrarImagen(lista);
      })
      .catch(err => console.error("Error:", err));
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo conectar con el servidor.');
    }
  }

  /*
    ICG005
    mostrarImagen: renderiza 3 gráficos (CIRCULARES).
    Requisitos:
    - Que Chart.js esté cargado (Chart definido)
    - Que existan canvas: #chartIngresos, #chartGastos, #chartComparativo
  */
  mostrarImagen(lista){
    if (typeof Chart === "undefined") {
      console.error("Chart.js no está cargado. Revisa que esté incluido (CDN) en inicio.html o en la página.");
      return;
    }

    const ingresos = Array.isArray(lista?.ingresos) ? lista.ingresos : [];
    const gastos   = Array.isArray(lista?.gastos)   ? lista.gastos   : [];

    // Helpers
    const toNumber = (v) => {
      const n = Number(String(v ?? "0").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    // Canvas
    const cIng = document.getElementById("chartIngresos");
    const cGas = document.getElementById("chartGastos");
    const cCmp = document.getElementById("chartComparativo");

    // Si cambió el HTML y no existen los IDs, no se puede dibujar
    if (!cIng || !cGas || !cCmp) {
      console.error("No se encontraron los canvas. Verifica IDs: chartIngresos, chartGastos, chartComparativo");
      return;
    }

    // Destruir charts previos (si reabres la pestaña)
    Object.values(this.charts).forEach(ch => ch?.destroy?.());
    this.charts = {};

    // Datos por concepto
    const ingresoLabels = ingresos.map(i => i.concepto);
    const ingresoData   = ingresos.map(i => toNumber(i.total_monto));

    const gastoLabels = gastos.map(g => g.concepto);
    const gastoData   = gastos.map(g => toNumber(g.total_monto));

    // Mensajes "no data"
    const noIng = document.getElementById("no-ingresos");
    const noGas = document.getElementById("no-gastos");
    const noCmp = document.getElementById("no-comp");
    if (noIng) noIng.style.display = (ingresos.length === 0) ? "block" : "none";
    if (noGas) noGas.style.display = (gastos.length === 0) ? "block" : "none";

    // 1) INGRESOS (circular doughnut)
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
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }

    // 2) GASTOS (circular doughnut)
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
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }

    // 3) COMPARATIVO (circular: Total Ingresos vs Total Gastos)
    const totalIng = ingresoData.reduce((a, b) => a + b, 0);
    const totalGas = gastoData.reduce((a, b) => a + b, 0);

    const hayComparacion = (totalIng > 0 || totalGas > 0);
    if (noCmp) noCmp.style.display = hayComparacion ? "none" : "block";

    if (hayComparacion) {
      this.charts.chartComparativo = new Chart(cCmp, {
        type: "doughnut",
        data: {
          labels: ["Ingresos", "Gastos"],
          datasets: [{
            data: [totalIng, totalGas],
            backgroundColor: ["rgba(59, 130, 246, 0.75)", "rgba(239, 68, 68, 0.75)"],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" }
          }
        }
      });
    }
  }

  /*
    ICG006
    generarColores: genera una paleta de colores reutilizable para gráficos (n elementos).
    - Usa una lista base y repite si n supera el tamaño base.
    *
    * @param {number} n Cantidad de colores requeridos.
    * @return {Array<string>} Lista de strings rgba para backgroundColor.
  */
  generarColores(n) {
    const base = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(234, 179, 8, 0.8)'
    ];
    const colores = [];
    for (let i = 0; i < n; i++) {
      colores.push(base[i % base.length]);
    }
    return colores;
  }

  /*
    ICG007
    asignarEventosBase: listeners globales (placeholder).
  */
  asignarEventosBase() {
    document.addEventListener('click', (event) => {});
    document.addEventListener('change', (event) => {
      if (event.target.id === 'usuario') {
        this.seleccionarUsuario(); // si lo usas en la vista
      }
    });
  }
}
