<?php
/**
 * BGP001
 * Página - balance_grafica.php
 * Propósito:
 * - Consultar a la BD el resumen de INGRESOS y GASTOS por concepto para un usuario
 * - Renderizar gráficos usando Chart.js:
 *    (1) Comparativo (Ingresos vs Gastos, gastos en negativo)
 *    (2) Ingresos: barras + pie
 *    (3) Gastos: barras + pie
 *
 * Dependencias:
 * - controller/database.php (clase Database con getInstance(), queryParams(), fetchAll())
 * - sidebar.php (menú lateral)
 * - Función BD: traerResumen(usuarioId, tipoConcepto)
 * - Chart.js desde CDN
 */

require_once 'controller/database.php';
session_start();

/**
 * BGP002
 * Lectura de parámetros enviados por URL (desde InterfazBalance) o desde la sesión.
 * - token       : autenticación (si se usa)
 * - usuarioID   : id del usuario para filtrar el resumen
 * - tipoUsuario : rol (no se usa aquí, pero se deja por si luego condicionas la vista)
 * - fecha       : filtro opcional (aún no se usa aquí)
 */
$token       = $_GET['token']       ?? ($_SESSION['token']      ?? 'TOKEN_DE_PRUEBA');
$usuarioId   = isset($_GET['usuarioID'])
               ? (int)$_GET['usuarioID']
               : ($_SESSION['usuario_id'] ?? 1);
$tipoUsuario = $_GET['tipoUsuario'] ?? null;
$fecha       = $_GET['fecha']       ?? null;

/**
 * BGP003
 * Variables de salida:
 * - $ingresos y $gastos serán arrays para serializar a JavaScript (json_encode)
 * - $error guardará mensaje si falla la consulta
 */
$ingresos = [];
$gastos   = [];
$error    = null;

try {
    /**
     * BGP004
     * Conexión a la base de datos usando patrón Singleton.
     */
    $db = Database::getInstance();

    /**
     * BGP005
     * Query a función de BD traerResumen(usuarioId, tipoConcepto)
     * Importante: los códigos de tipo deben coincidir con tu BD (tipoconconcepto).
     * Aquí se asume: '1' = ingreso, '2' = gasto.
     */
    $sql = "SELECT * FROM traerResumen($1, $2)";

    // BGP006: INGRESOS
    $resultIngresos = $db->queryParams($sql, [$usuarioId, '1']);
    $ingresos = $db->fetchAll($resultIngresos);

    // BGP007: GASTOS
    $resultGastos = $db->queryParams($sql, [$usuarioId, '2']);
    $gastos = $db->fetchAll($resultGastos);

} catch (Exception $e) {
    /**
     * BGP008
     * Captura de error para mostrarlo en el HTML sin romper la página.
     */
    $error = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- BGP009: cabecera y dependencias -->
    <meta charset="UTF-8">
    <title>Balance - Gráfica</title>

    <!-- BGP010: estilos globales de la app (si aplica) -->
    <link rel="stylesheet" href="../style.css" />

    <!-- BGP011: Chart.js requerido para renderizar los gráficos -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- BGP012: estilos locales de esta pantalla -->
    <style>
        body {
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f3f4f6;
            color: #111827;
        }

        /* BGP013: layout con sidebar + contenido */
        .layout {
            display: grid;
            grid-template-columns: 260px 1fr;
            min-height: 100vh;
        }

        /* BGP014: contenedor principal centrado */
        .main-content {
            padding: 24px 40px 40px;
            max-width: 1100px;
            margin: 0 auto;
        }

        /* BGP015: barra superior con botón atrás */
        .top-bar {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 16px;
        }

        .btn-back {
            border: none;
            background: #111827;
            color: #f9fafb;
            padding: 8px 18px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 14px;
        }

        .btn-back:hover { opacity: 0.9; }

        h1 { font-size: 22px; margin: 0 0 10px; }
        h2 { font-size: 18px; margin: 24px 0 8px; }
        h3 { font-size: 14px; margin: 4px 0 8px; color: #6b7280; }

        /* BGP016: grid de 2 columnas para tarjetas */
        .row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        /* BGP017: grid de 1 columna para comparativo */
        .row-1 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        }

        /* BGP018: tarjeta visual */
        .card {
            background: #ffffff;
            border-radius: 10px;
            padding: 12px 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* BGP019: límite de tamaño del canvas */
        .card canvas {
            max-width: 100%;
            max-height: 260px;
        }

        /* BGP020: caja de error */
        .error {
            background: #fee2e2;
            color: #b91c1c;
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }

        /* BGP021: texto de “sin datos” */
        .no-data {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 6px;
        }
    </style>
</head>
<body>

<div class="layout">
    <!-- BGP022: sidebar (menú lateral). Debe existir sidebar.php en el mismo directorio -->
    <?php include 'sidebar.php'; ?>

    <main class="main-content">
        <div class="top-bar">
            <!-- BGP023: vuelve a la pantalla anterior -->
            <button class="btn-back" onclick="window.history.back()">Atrás</button>
        </div>

        <h1>Balance - Gráfica</h1>

        <!-- BGP024: muestra error si algo falló en PHP -->
        <?php if (!empty($error)): ?>
            <div class="error">
                Error al obtener datos: <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- BGP025: COMPARATIVO (INGRESOS vs GASTOS) -->
        <section>
            <h2>COMPARATIVO</h2>
            <div class="row-1">
                <div class="card">
                    <h3>Ingresos vs Gastos (Gastos en negativo)</h3>
                    <canvas id="chartComparativo"></canvas>
                    <?php if (empty($ingresos) && empty($gastos)): ?>
                        <div class="no-data">No hay datos para mostrar.</div>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- BGP026: INGRESOS -->
        <section>
            <h2>INGRESOS</h2>
            <div class="row">
                <div class="card">
                    <h3>Ingresos por conceptos</h3>
                    <canvas id="chartIngresos"></canvas>
                    <?php if (empty($ingresos)): ?>
                        <div class="no-data">No hay datos de ingresos para mostrar.</div>
                    <?php endif; ?>
                </div>

                <div class="card">
                    <h3>Distribución de Ingresos</h3>
                    <canvas id="pieIngresos"></canvas>
                    <?php if (empty($ingresos)): ?>
                        <div class="no-data">No hay datos de ingresos para mostrar.</div>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- BGP027: GASTOS -->
        <section>
            <h2>GASTOS</h2>
            <div class="row">
                <div class="card">
                    <h3>Gastos por conceptos</h3>
                    <canvas id="chartGastos"></canvas>
                    <?php if (empty($gastos)): ?>
                        <div class="no-data">No hay datos de gastos para mostrar.</div>
                    <?php endif; ?>
                </div>

                <div class="card">
                    <h3>Distribución de Gastos</h3>
                    <canvas id="pieGastos"></canvas>
                    <?php if (empty($gastos)): ?>
                        <div class="no-data">No hay datos de gastos para mostrar.</div>
                    <?php endif; ?>
                </div>
            </div>
        </section>

    </main>
</div>

<script>
  /**
   * BGP028
   * Serialización de datos PHP -> JavaScript.
   * Se usa JSON_NUMERIC_CHECK para convertir números a tipo number cuando sea posible.
   */
  const ingresos = <?= json_encode($ingresos, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;
  const gastos   = <?= json_encode($gastos,   JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;

  /**
   * BGP029
   * generarColores(n): retorna n colores reutilizando una paleta base
   * (para backgroundColor en datasets de Chart.js).
   */
  function generarColores(n) {
    const base = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(234, 179, 8, 0.8)'
    ];
    const colores = [];
    for (let i = 0; i < n; i++) colores.push(base[i % base.length]);
    return colores;
  }

  /**
   * BGP030
   * Helpers para el comparativo:
   * - toMap: convierte [{concepto,total_monto}, ...] a { concepto: total }
   * - unionLabels: une conceptos de ingresos y gastos sin duplicados
   */
  function toMap(arr) {
    const m = {};
    (arr || []).forEach(x => { m[x.concepto] = Number(x.total_monto || 0); });
    return m;
  }
  function unionLabels(a, b) {
    const set = new Set();
    (a || []).forEach(x => set.add(x.concepto));
    (b || []).forEach(x => set.add(x.concepto));
    return Array.from(set);
  }

  // =========================
  // BGP031: 1) INGRESOS (bar + pie)
  // =========================
  if (ingresos.length > 0) {
    const ingresoLabels = ingresos.map(i => i.concepto);
    const ingresoData   = ingresos.map(i => Number(i.total_monto || 0));

    // BGP032: barras de ingresos por concepto
    new Chart(document.getElementById('chartIngresos'), {
      type: 'bar',
      data: {
        labels: ingresoLabels,
        datasets: [{
          label: 'Ingresos',
          data: ingresoData,
          backgroundColor: generarColores(ingresoData.length)
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // BGP033: pie de distribución de ingresos
    new Chart(document.getElementById('pieIngresos'), {
      type: 'pie',
      data: {
        labels: ingresoLabels,
        datasets: [{
          data: ingresoData,
          backgroundColor: generarColores(ingresoData.length)
        }]
      }
    });
  }

  // =========================
  // BGP034: 2) GASTOS (bar + pie)
  // =========================
  if (gastos.length > 0) {
    const gastoLabels = gastos.map(g => g.concepto);
    const gastoData   = gastos.map(g => Number(g.total_monto || 0));

    // BGP035: barras de gastos por concepto
    new Chart(document.getElementById('chartGastos'), {
      type: 'bar',
      data: {
        labels: gastoLabels,
        datasets: [{
          label: 'Gastos',
          data: gastoData,
          backgroundColor: generarColores(gastoData.length)
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // BGP036: pie de distribución de gastos
    new Chart(document.getElementById('pieGastos'), {
      type: 'pie',
      data: {
        labels: gastoLabels,
        datasets: [{
          data: gastoData,
          backgroundColor: generarColores(gastoData.length)
        }]
      }
    });
  }

  // =========================
  // BGP037: 3) COMPARATIVO (ambos)
  // - Une conceptos
  // - Gastos en negativo para que se dibujen debajo del eje
  // =========================
  const labelsUnion = unionLabels(ingresos, gastos);
  const mapIngresos = toMap(ingresos);
  const mapGastos   = toMap(gastos);

  const dataIngresosUnion = labelsUnion.map(l => Number(mapIngresos[l] || 0));
  const dataGastosNeg     = labelsUnion.map(l => -Number(mapGastos[l] || 0));

  if (labelsUnion.length > 0) {
    new Chart(document.getElementById('chartComparativo'), {
      type: 'line', // BGP038: comparativo tipo línea (puede cambiarse a 'bar' si prefieres)
      data: {
        labels: labelsUnion,
        datasets: [
          {
            label: 'Ingresos',
            data: dataIngresosUnion,
            tension: 0.3
          },
          {
            label: 'Gastos',
            data: dataGastosNeg,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              // BGP039: muestra el valor absoluto aunque el dato sea negativo
              callback: (value) => Math.abs(value)
            }
          }
        }
      }
    });
  }
</script>

</body>
</html>
