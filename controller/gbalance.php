<?php
    require_once 'database.php';

    /**
     * CGB001
     * Controlador - Componente/Clase GBalance (gbalance.php).
     * Propósito: gestionar operaciones relacionadas a Balance:
     * - Traer balance diario/mensual (a una fecha)
     * - Traer lista de balance + movimientos
     * - Traer datos para gráficos (ingresos vs gastos)
     * - Traer historial por rango de fechas
     *
     * Dependencias:
     * - Database (Singleton) para ejecutar consultas
     * - Funciones de BD: traerBalance, traerMovimientos, traerResumen, traerHistorial
     **/
    class GBalance {
        // Propiedades públicas (se usan como datos de trabajo/configuración en el controlador)
        public $nombre;
        public $tipo;
        public $periodo;
        public $dia;
        public $usuarioID;
        public $token;

        /**
         * CGB002
         * Controlador - Balance.
         * Se encarga de traer el balance del usuario para una fecha determinada.
         *
         * Flujo:
         * 1) Obtiene instancia de BD
         * 2) Si no se envía fecha, usa la actual
         * 3) Llama a la función de BD traerBalance(usuarioID, token, fecha)
         * 4) Decodifica JSON y retorna total_general y total_mensual
         *
         * @param int $usuarioID ID del usuario del cual se genera el balance.
         * @param string $token Token de autenticación.
         * @param string $fecha Fecha (Y-m-d). Si está vacío, usa la fecha actual.
         * @return array Lista que contiene total_general y total_mensual.
         */
        function traerBalance($usuarioID, $token, $fecha=""){
            // Obtener conexión a la base de datos (Singleton)
            $db = Database::getInstance();

            // Si no se especifica fecha, se usa la del día actual
            if ($fecha=="") $fecha = date('Y-m-d');

            // Llamada a función SQL: retorna un JSON en la columna "balance"
            $sql = "traerBalance($1, $2, $3) AS balance";
            $params = [$usuarioID, $token, $fecha];

            // Ejecuta consulta con parámetros para mayor seguridad
            $res = $db->executeParams($sql, $params);

            // Obtiene la fila resultante
            $row = pg_fetch_assoc($res);

            // Decodifica el JSON retornado por la BD
            $balance = json_decode($row["balance"], true);

            // Devuelve la respuesta en el formato esperado por la capa de interfaz
            return array("lista"=>array(
                "total_general"=>$balance["total_general"],
                "total_mensual"=>$balance["total_mensual"]
            ));
        }

        /**
         * CGB003
         * Controlador - Balance.
         * Se encarga de traer:
         * - Lista de balance (totales)
         * - Lista de movimientos (detalle)
         * para un usuario y una fecha determinada.
         *
         * Flujo:
         * 1) Si no se envía fecha, usa la actual
         * 2) Llama a la función de BD traerMovimientos(token, usuarioID, tipoUsuario, fecha)
         * 3) Decodifica JSON de listabalance y listamovimientos
         *
         * @param string $token Token de autenticación.
         * @param int $usuarioID ID del usuario.
         * @param string $tipoUsuario Tipo de usuario (rol/perfil).
         * @param string $fecha Fecha (Y-m-d). Si está vacío, usa la fecha actual.
         * @return array Respuesta con listaBalance y listaMovimientos.
         */
        function traerBalanceLista($token, $usuarioID, $tipoUsuario, $fecha=""){
            // Obtener conexión a la base de datos (Singleton)
            $db = Database::getInstance();

            // Si no se especifica fecha, se usa la del día actual
            if ($fecha=="") $fecha = date('Y-m-d');

            // Llamada a función SQL que retorna dos columnas (listabalance, listamovimientos)
            $sql = "traerMovimientos($1, $2, $3, $4)";
            $params = [$token, $usuarioID, $tipoUsuario, $fecha];

            // Ejecuta consulta con parámetros
            $res = $db->queryParams($sql, $params);

            // Obtiene la fila resultante
            $row = pg_fetch_assoc($res);

            // Si no hay movimientos, asegurar un JSON válido (arreglo vacío)
            if ($row["listamovimientos"]==NULL){
                $row["listamovimientos"] = "[]";
            }

            // Decodifica ambos JSON para devolverlos como arrays en PHP
            $respuesta = [
                "listaBalance" => json_decode($row["listabalance"], true),
                "listaMovimientos" => json_decode($row["listamovimientos"], true)
            ];

            return $respuesta;
        }

        /**
         * CGB004
         * Controlador - Balance (Datos para gráfico).
         * Se encarga de traer datos agrupados para gráficos:
         * - Ingresos (tipoconconcepto = '1')
         * - Gastos   (tipoconconcepto = '-1')
         *
         * Flujo:
         * 1) Ejecuta traerResumen(usuarioID, '1') para ingresos
         * 2) Ejecuta traerResumen(usuarioID, '-1') para gastos
         * 3) Convierte resultados a arreglos con fetchAll
         *
         * @param string $token Token de autenticación (en este método no se usa directamente).
         * @param int $usuarioID ID del usuario.
         * @return array Arreglos con ingresos y gastos.
         */
        function traerGraficoIngresos($token, $usuarioID){
            // Obtener conexión a la base de datos (Singleton)
            $db = Database::getInstance();

            // Función SQL para obtener resumen por concepto según tipo
            $sql = "traerResumen($1, $2)";

            // INGRESOS: tipoconconcepto = '1'
            $resultIngresos = $db->queryParams($sql, [$usuarioID, '1']);
            $ingresos = $db->fetchAll($resultIngresos);

            // GASTOS: tipoconconcepto = '-1'
            $resultGastos = $db->queryParams($sql, [$usuarioID, '-1']);
            $gastos = $db->fetchAll($resultGastos);

            // Retorna estructura lista para gráficos (front)
            return array("ingresos"=>$ingresos, "gastos"=>$gastos);
        }

        /**
         * CGB005
         * Controlador - Balance (Historial).
         * Se encarga de traer el historial de movimientos por rango de fechas.
         *
         * Flujo:
         * 1) Ejecuta traerHistorial(token, usuarioID, fechainicio, fechafin)
         * 2) Convierte el resultset a array con pg_fetch_all
         * 3) Retorna total (inicializado en 0.00) y lista
         *
         * @param string $token Token de autenticación.
         * @param int $usuarioID ID del usuario (si es 0 podría traer todo, depende de la función SQL).
         * @param string $fechainicio Fecha inicio del rango (Y-m-d).
         * @param string $fechafin Fecha fin del rango (Y-m-d).
         * @return array Respuesta con total y lista del historial.
         */
        function traerHistorial($token, $usuarioID,$fechainicio, $fechafin){
            // Obtener conexión a la base de datos (Singleton)
            $db = Database::getInstance();

            // Llamada a función SQL de historial por rango
            $sql = "traerHistorial($1, $2, $3, $4)";
            $params = [$token, $usuarioID, $fechainicio, $fechafin];

            // Ejecuta consulta con parámetros
            $res = $db->queryParams($sql, $params);

            // Obtiene todas las filas del historial
            $historial = pg_fetch_all($res);

            // Estructura de respuesta para la interfaz
            $respuesta = [
                "total" => 0.00,   // Total podría calcularse en front o agregarse luego si se requiere
                "lista" => $historial
            ];

            return $respuesta;
        }
    };
?>
