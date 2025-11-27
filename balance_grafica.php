<?php
/**
 * BGP001
 * Página - balance_grafica.php
 *
 * Propósito:
 * - Consultar a la BD el resumen de INGRESOS y GASTOS por concepto para un usuario.
 * - Renderizar 3 gráficos circulares (doughnut):
 *   (1) Ingresos por concepto
 *   (2) Gastos por concepto
 *   (3) Comparativo total (Ingresos vs Gastos)
 *
 * Importante:
 * - Este archivo hace 2 cosas:
 *   1) Backend (PHP): consulta la BD y arma arrays $ingresos / $gastos
 *   2) Frontend (HTML+JS): recibe esos arrays y dibuja charts con Chart.js
 *
 * Dependencias:
 * - controller/database.php (Database::getInstance(), queryParams(), fetchAll())
 * - sidebar.php (menú lateral)
 * - Función BD: traerResumen(usuarioId, tipoConcepto)
 * - Chart.js (CDN)
 */

require_once 'controller/database.php';
session_start();

/**
 * BGP002
 * Lectura de parámetros (GET o sesión)
 * - token: opcional, por si tu app lo usa para autenticación / navegación.
 * - usuarioID: id del usuario a consultar (se castea a int por seguridad).
 * - tipoUsuario y fecha: reservados para futuras mejoras (filtros).
 *
 * Nota:
 * - Si no hay usuario en URL ni sesión, se usa 1 como fallback (útil en pruebas).
 */
$token       = $_GET['token']       ?? ($_SESSION['token']      ?? 'TOKEN_DE_PRUEBA');
$usuarioId   = isset($_GET['usuarioID'])
               ? (int)$_GET['usuarioID']
               : (int)($_SESSION['usuario_id'] ?? 1);
$tipoUsuario = $_GET['tipoUsuario'] ?? null;
$fecha       = $_GET['fecha']       ?? null;

/**
 * BGP003
 * Constantes/mapeo para identificar tipos en BD
 * - Ajusta según tu BD:
 *   ejemplo: 1 = ingreso, 2 = gasto
 *   (si usas -1 para gasto, cambia $TIPO_GASTO a '-1')
 */
$TIPO_INGRESO = '1';
$TIPO_GASTO   = '2';

/**
 * BGP003A
 * Variables donde se guardarán los resultados y el posible error para mostrar en pantalla.
 */
$ingresos = [];
$gastos   = [];
$error    = null;

try {
    /**
     * BGP004
     * Conexión a BD y consulta a la función traerResumen(usuarioId, tipoConcepto).
     * - Se espera que la función devuelva filas con:
     *   concepto, total_monto (y/o columnas adicionales que ignores)
     *
     * Importante:
     * - Usamos query parametrizado ($1, $2) para evitar inyección SQL.
     */
    $db = Database::getInstance();
    $sql = "SELECT * FROM traerResumen($1, $2)";

    /**
     * BGP005
     * Consulta de INGRESOS:
     * - Ejecuta traerResumen(usuarioId, TIPO_INGRESO)
     * - fetchAll() convierte el resultado en array PHP (listado de filas).
     */
    $resultIngresos = $db->queryParams($sql, [$usuarioId, $TIPO_INGRESO]);
    $ingresos = $db->fetchAll($resultIngresos);

    /**
     * BGP006
     * Consulta de GASTOS:
     * - Ejecuta traerResumen(usuarioId, TIPO_GASTO)
     * - $gastos queda como array de filas con concepto y total_monto.
     */
    $resultGastos = $db->queryParams($sql, [$usuarioId, $TIPO_GASTO]);
    $gastos = $db->fetchAll($resultGastos);

} catch (Exception $e) {
    /**
     * BGP007
     * Manejo de errores:
     * - Si falla la conexión o la función SQL, guardamos el mensaje para mostrarlo.
     * - Así el usuario ve “Error al obtener datos...” en vez de una pantalla en blanco.
     */
    $error = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <!-- BGP008: Metadatos básicos -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Balance - Gráfica</title>

  <!--
    BGP009
    Estilos globales de tu app (si existe).
    - Ajusta la ruta si tu estructura cambia.
  -->
  <link rel="stylesheet" href="style.css" />

  <!--
    BGP010
    Librería Chart.js desde CDN.
    - Sin esto, "Chart" no existe en JS y no se pueden dibujar gráficos.
  -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    /* BGP011: Estilo base del body */
    body{
      margin:0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:#f3f4f6;
      color:#111827;
    }

    /* BGP012: Layout general (sidebar + contenido) */
    .layout{
      display:grid;
      grid-template-columns:260px 1fr; /* 260px sidebar, resto contenido */
      min-height:100vh;
    }

    /* BGP013: Contenedor principal del contenido */
    .main-content{
      padding: 18px 22px 28px;
      max-width: 1300px; /* limita el ancho para que se vea ordenado */
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    /* BGP014: Barra superior (botón atrás) */
    .top-bar{
      display:flex;
      justify-content:flex-end;
      margin-bottom: 10px;
      gap: 10px;
    }

    /* Botón "Atrás" */
    .btn-back{
      border:none;
      background:#111827;
      color:#f9fafb;
      padding: 10px 18px;
      border-radius:999px;
      cursor:pointer;
      font-size:14px;
      font-weight:700;
    }
    .btn-back:hover{ opacity:.92; }

    h1{
      font-size: 22px;
      margin: 0 0 14px;
    }

    /* BGP015: Grid de charts (3 cards por fila en desktop) */
    .charts-grid{
      display:grid;
      grid-template-columns: repeat(3, minmax(260px, 1fr));
      gap: 14px;
      align-items: stretch;
    }

    /* Responsive: en pantallas medianas pasa a 2 columnas */
    @media (max-width: 1050px){
      .charts-grid{ grid-template-columns: repeat(2, minmax(260px, 1fr)); }
    }

    /* Responsive: en móviles pasa a 1 columna */
    @media (max-width: 720px){
      .charts-grid{ grid-template-columns: 1fr; }
    }

    /* BGP016: Card visual para cada gráfico */
    .card{
      background:#fff;
      border-radius: 14px;
      padding: 14px 14px 12px;
      border: 1px solid #eef0f2;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .card h3{
      margin: 0 0 10px;
      font-size: 13px;
      color: #6b7280;
      font-weight: 800;
      letter-spacing: .02em;
      text-transform: uppercase;
    }

    /* BGP017: Altura fija para que Chart.js renderice correctamente */
    .chart-wrap{
      height: 280px;
    }
    .chart-wrap canvas{
      width: 100% !important;
      height: 100% !important;
      display:block;
    }

    /* BGP018: Caja de error (si BD falla) */
    .error{
      background:#fee2e2;
      color:#b91c1c;
      padding:10px 12px;
      border-radius: 10px;
      margin: 0 0 12px;
      font-size: 14px;
    }

    /* Mensajes de "no hay datos" (se muestran por JS si aplica) */
    .no-data{
      display:none;
      margin-top: 10px;
      font-size: 13px;
      color:#9ca3af;
      font-weight: 600;
    }
  </style>
</head>

<body>
  <div class="layout">
    <!--
      BGP019
      Sidebar de navegación (menú).
      - Este include inserta el HTML del menú lateral.
    -->
    <?php include 'sidebar.php'; ?>

    <!-- BGP020: Contenido principal -->
    <main class="main-content">
      <div class="top-bar">
        <!--
          BGP021
          Botón atrás:
          - Si hay historial del navegador: history.back()
          - Si NO hay historial (por ejemplo, entraron directo por URL): redirige a inicio.html
        -->
        <button class="btn-back" type="button"
          onclick="(window.history.length > 1) ? window.history.back() : (window.location.href='pages/inicio.html');">
          Atrás
        </button>
      </div>

      <h1>Balance - Gráfica</h1>

      <!--
        BGP022
        Mostrar error del backend si existe:
        - htmlspecialchars evita inyección HTML/JS (seguridad).
      -->
      <?php if (!empty($error)): ?>
        <div class="error">Error al obtener datos: <?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <!--
        BGP023
        Estructura de 3 gráficos (doughnut) en cards:
        - Cada canvas tiene un ID que se usa en JavaScript para instanciar Chart()
        - Los div "no-data" se muestran si el dataset está vacío.
      -->
      <div class="charts-grid">
        <section class="card">
          <h3>Ingresos por concepto</h3>
          <div class="chart-wrap"><canvas id="chartIngresos"></canvas></div>
          <div id="no-ingresos" class="no-data">No hay datos de ingresos para mostrar.</div>
        </section>

        <section class="card">
          <h3>Gastos por concepto</h3>
          <div class="chart-wrap"><canvas id="chartGastos"></canvas></div>
          <div id="no-gastos" class="no-data">No hay datos de gastos para mostrar.</div>
        </section>

        <section class="card">
          <h3>Comparativo (Total)</h3>
          <div class="chart-wrap"><canvas id="chartComparativo"></canvas></div>
          <div id="no-comp" class="no-data">No hay datos para comparar.</div>
        </section>
      </div>
    </main>
  </div>

  <script>
    /**
     * BGP024
     * Paso de datos desde PHP (backend) a JavaScript (frontend).
     * - json_encode convierte arrays PHP en JSON válido.
     * - JSON_NUMERIC_CHECK intenta transformar strings numéricos en numbers.
     */
    const ingresos = <?= json_encode($ingresos, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;
    const gastos   = <?= json_encode($gastos,   JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;

    /**
     * BGP025
     * Helpers (funciones auxiliares)
     */

    /**
     * Convierte valores a número de forma segura.
     * - Soporta casos donde total_monto llegue como "12,50" (coma) o "12.50" (punto).
     * - Si no se puede convertir, retorna 0.
     */
    const toNumber = (v) => {
      const n = Number(String(v ?? "0").replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    /**
     * Genera una lista de colores (RGBA) para n porciones del doughnut.
     * - Usa una paleta base y repite si n es mayor al tamaño base.
     */
    function generarColores(n) {
      const base = [
        'rgba(59, 130, 246, 0.80)',  // azul
        'rgba(16, 185, 129, 0.80)',  // verde
        'rgba(249, 115, 22, 0.80)',  // naranja
        'rgba(239, 68, 68, 0.80)',   // rojo
        'rgba(139, 92, 246, 0.80)',  // morado
        'rgba(234, 179, 8, 0.80)'    // amarillo
      ];
      const colores = [];
      for (let i = 0; i < n; i++) colores.push(base[i % base.length]);
      return colores;
    }

    /**
     * BGP026
     * Referencias a los canvas (donde Chart.js dibuja).
     */
    const cIng = document.getElementById("chartIngresos");
    const cGas = document.getElementById("chartGastos");
    const cCmp = document.getElementById("chartComparativo");

    /**
     * Validación rápida:
     * - Si Chart.js no cargó, Chart será undefined y no se podrán crear gráficos.
     */
    if (typeof Chart === "undefined") {
      console.error("Chart.js no está cargado.");
    }

    /**
     * BGP027
     * Gráfico 1: INGRESOS (doughnut por concepto)
     * - labels: nombres de conceptos
     * - data  : montos por concepto
     */
    const ingresoLabels = (ingresos || []).map(i => i.concepto);
    const ingresoData   = (ingresos || []).map(i => toNumber(i.total_monto));

    if (ingresos.length > 0) {
      new Chart(cIng, {
        type: "doughnut",
        data: {
          labels: ingresoLabels,
          datasets: [{
            data: ingresoData,
            backgroundColor: generarColores(ingresoData.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } } // leyenda abajo
        }
      });
    } else {
      // Si no hay ingresos, mostramos el mensaje "no hay datos"
      const noIng = document.getElementById("no-ingresos");
      if (noIng) noIng.style.display = "block";
    }

    /**
     * BGP028
     * Gráfico 2: GASTOS (doughnut por concepto)
     */
    const gastoLabels = (gastos || []).map(g => g.concepto);
    const gastoData   = (gastos || []).map(g => toNumber(g.total_monto));

    if (gastos.length > 0) {
      new Chart(cGas, {
        type: "doughnut",
        data: {
          labels: gastoLabels,
          datasets: [{
            data: gastoData,
            backgroundColor: generarColores(gastoData.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    } else {
      // Si no hay gastos, mostramos el mensaje "no hay datos"
      const noGas = document.getElementById("no-gastos");
      if (noGas) noGas.style.display = "block";
    }

    /**
     * BGP029
     * Gráfico 3: COMPARATIVO TOTAL (Ingresos vs Gastos)
     * - Suma total de ingresos y gastos para comparar en un doughnut de 2 porciones.
     */
    const totalIng = ingresoData.reduce((a,b) => a + b, 0);
    const totalGas = gastoData.reduce((a,b) => a + b, 0);

    if (totalIng > 0 || totalGas > 0) {
      new Chart(cCmp, {
        type: "doughnut",
        data: {
          labels: ["Ingresos", "Gastos"],
          datasets: [{
            data: [totalIng, totalGas],
            backgroundColor: ["rgba(59,130,246,.75)", "rgba(239,68,68,.75)"],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    } else {
      // Si ambos totales son 0, no tiene sentido dibujar el comparativo.
      const noCmp = document.getElementById("no-comp");
      if (noCmp) noCmp.style.display = "block";
    }
  </script>
</body>
</html>
