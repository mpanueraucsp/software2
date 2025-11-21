<?php
require_once 'controller/database.php';
session_start();

// Leer datos desde la URL (enviados por InterfazBalance)
$token       = $_GET['token']       ?? ($_SESSION['token']      ?? 'TOKEN_DE_PRUEBA');
$usuarioId   = isset($_GET['usuarioID'])
               ? (int)$_GET['usuarioID']
               : ($_SESSION['usuario_id'] ?? 1);
$tipoUsuario = $_GET['tipoUsuario'] ?? null;
$fecha       = $_GET['fecha']       ?? null; // por si luego lo usas en filtros

$ingresos = [];
$gastos   = [];
$error    = null;

try {
    $db = Database::getInstance();

    // '1' y '2' deben coincidir con conceptos.tipoconconcepto
    $sql = "SELECT * FROM traerResumen($1, $2)";

    // INGRESOS
    $resultIngresos = $db->queryParams($sql, [$usuarioId, '1']);
    $ingresos = $db->fetchAll($resultIngresos);

    // GASTOS
    $resultGastos = $db->queryParams($sql, [$usuarioId, '2']);
    $gastos = $db->fetchAll($resultGastos);

} catch (Exception $e) {
    $error = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    
    <title>Balance - Gráfica</title>
    <link rel="stylesheet" href="../style.css" />
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
        body {
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f3f4f6;
            color: #111827;
        }

        .layout {
            display: grid;
            grid-template-columns: 260px 1fr;
            min-height: 100vh;
        }

        /* Barra izquierda fija, como “shell” de la app */
        .sidebar {
            background: #f9fafb;
            border-right: 1px solid #e5e7eb;
            padding: 24px 20px;

            position: sticky;   /* se queda pegada */
            top: 0;
            align-self: start;
            height: 100vh;
            box-sizing: border-box;
        }


        .sidebar-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .sidebar-menu {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 14px;
        }

        .sidebar-menu li {
            margin-bottom: 8px;
        }

        .sidebar-menu li strong {
            font-weight: 600;
        }

        /* Main content */
        .main-content {
            padding: 24px 40px 40px;
            max-width: 1100px;
            margin: 0 auto;
        }

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

        .btn-back:hover {
            opacity: 0.9;
        }

        h1 {
            font-size: 22px;
            margin: 0 0 24px;
        }

        h2 {
            font-size: 18px;
            margin: 24px 0 8px;
        }

        h3 {
            font-size: 14px;
            margin: 4px 0 8px;
            color: #6b7280;
        }

        .row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;                 /* menos espacio entre tarjetas */
        }

        .card {
            background: #ffffff;
            border-radius: 10px;
            padding: 10px 12px;        /* menos padding = tarjeta más pequeña */
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* tamaño máximo de los gráficos */
        .card canvas {
            max-width: 100%;
            max-height: 200px;         /* ↓ ajusta este valor si los quieres aún más chicos */
        }

        .error {
            background: #fee2e2;
            color: #b91c1c;
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }

        .no-data {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 6px;
        }
    </style>
</head>
<body>

<div class="layout">
    <!-- Sidebar tipo SPF-006/SPF-008 -->
    <?php include 'sidebar.php'; ?>

    <!-- Main -->
    <main class="main-content">
        <div class="top-bar">
            <button class="btn-back" onclick="window.history.back()">Atrás</button>
        </div>

        <h1>Balance - Gráfica</h1>

        <?php if (!empty($error)): ?>
            <div class="error">
                Error al obtener datos: <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- INGRESOS -->
        <section>
            <h2>INGRESOS</h2>
            <div class="row">
                <div class="card">
                    <h3>Distribución por Ingresos</h3>
                    <canvas id="pieIngresos"></canvas>
                    <?php if (empty($ingresos)): ?>
                        <div class="no-data">No hay datos de ingresos para mostrar.</div>
                    <?php endif; ?>
                </div>
                <div class="card">
                    <h3>Ingresos por conceptos</h3>
                    <canvas id="barIngresos"></canvas>
                    <?php if (empty($ingresos)): ?>
                        <div class="no-data">No hay datos de ingresos para mostrar.</div>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- GASTOS -->
        <section>
            <h2>GASTOS</h2>
            <div class="row">
                <div class="card">
                    <h3>Distribución por Gastos</h3>
                    <canvas id="pieGastos"></canvas>
                    <?php if (empty($gastos)): ?>
                        <div class="no-data">No hay datos de gastos para mostrar.</div>
                    <?php endif; ?>
                </div>
                <div class="card">
                    <h3>Gastos por conceptos</h3>
                    <canvas id="barGastos"></canvas>
                    <?php if (empty($gastos)): ?>
                        <div class="no-data">No hay datos de gastos para mostrar.</div>
                    <?php endif; ?>
                </div>
            </div>
        </section>
    </main>
</div>

<script>
    // Pasamos los arrays PHP a JS
    const ingresos = <?= json_encode($ingresos, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;
    const gastos   = <?= json_encode($gastos,   JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK) ?>;

    const ingresoLabels = ingresos.map(i => i.concepto);
    const ingresoData   = ingresos.map(i => i.total_monto);

    const gastoLabels = gastos.map(g => g.concepto);
    const gastoData   = gastos.map(g => g.total_monto);

    // Utilidad: genera una paleta básica según cantidad de datos
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
        for (let i = 0; i < n; i++) {
            colores.push(base[i % base.length]);
        }
        return colores;
    }

    // Solo pintar gráficos si hay datos
    if (ingresos.length > 0) {
        const coloresIngresos = generarColores(ingresoData.length);

        // Pie INGRESOS
        new Chart(document.getElementById('pieIngresos'), {
            type: 'pie',
            data: {
                labels: ingresoLabels,
                datasets: [{
                    data: ingresoData,
                    backgroundColor: coloresIngresos
                }]
            }
        });

        // Barra INGRESOS
        new Chart(document.getElementById('barIngresos'), {
            type: 'bar',
            data: {
                labels: ingresoLabels,
                datasets: [{
                    data: ingresoData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#4b5563' }
                    },
                    y: {
                        ticks: { color: '#4b5563' }
                    }
                }
            }
        });
    }

    if (gastos.length > 0) {
        const coloresGastos = generarColores(gastoData.length);

        // Pie GASTOS
        new Chart(document.getElementById('pieGastos'), {
            type: 'pie',
            data: {
                labels: gastoLabels,
                datasets: [{
                    data: gastoData,
                    backgroundColor: coloresGastos
                }]
            }
        });

        // Barra GASTOS
        new Chart(document.getElementById('barGastos'), {
            type: 'bar',
            data: {
                labels: gastoLabels,
                datasets: [{
                    data: gastoData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#4b5563' }
                    },
                    y: {
                        ticks: { color: '#4b5563' }
                    }
                }
            }
        });
    }
</script>

</body>
</html>
