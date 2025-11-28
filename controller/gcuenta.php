<?php
    require_once 'database.php';

    /**
     * CGQ001
     * Controlador - GCuenta (gcuenta.php).
     * Propósito: gestionar las cuentas/movimientos de ingresos y egresos del usuario:
     * - Enviar/guardar movimientos (ingresos/gastos) en BD desde un JSON
     * - Cargar la cuenta del usuario (conceptos + montos) para una fecha determinada
     *
     * Dependencias:
     * - Database (Singleton)
     * - Funciones de BD: guardarDatos(jsonb), obtenerCuentaUsuario(usuarioID, fecha)
     **/
    class GCuenta {
        // Propiedades públicas (contexto de trabajo)
        public $nombre;
        public $tipo;
        public $periodo;
        public $dia;
        public $usuarioID;
        public $token;

        /**
         * CGQ002
         * Controlador - Cuenta (Guardar movimientos).
         * Se encarga de enviar a la BD los movimientos (ingresos/gastos) recibidos en formato JSON.
         *
         * Flujo:
         * 1) Decodifica el JSON recibido ($datos)
         * 2) Re-encodea a JSON para enviarlo como jsonb
         * 3) Llama a la función SQL guardarDatos($1::jsonb)
         * 4) Decodifica la respuesta JSON y retorna success = ok
         *
         * @param string $datos JSON con un movimiento {...} o arreglo {datos:[...]}.
         * @return array success=true/false según respuesta de la función SQL.
         */
        function enviarDatos($datos){

            // Obtener instancia de BD (Singleton)
            $db = Database::getInstance();

            // Convertir el string JSON recibido a un arreglo asociativo de PHP
            $datosJson = json_decode($datos, true);

            // Llamada a función SQL: guardarDatos recibe un jsonb con movimientos
            $sql = "guardarDatos($1::jsonb) AS r";

            // Se vuelve a codificar a JSON para enviarlo a PostgreSQL como jsonb
            $params = [ json_encode($datosJson, JSON_UNESCAPED_UNICODE) ];

            // Ejecutar consulta con parámetros
            $res = $db->executeParams($sql, $params);

            // Obtener respuesta (columna "r" contiene un JSON con ok e items)
            $row = pg_fetch_assoc($res);

            // Decodificar JSON de respuesta para leer el flag "ok"
            $r = json_decode($row["r"], true);

            // Retorna estructura simple para el front
            return array("success"=>$r["ok"]);
        }

        /**
         * CGQ003
         * Controlador - Cuenta (Cargar cuenta del usuario).
         * Se encarga de obtener la cuenta del usuario para una fecha:
         * - Lista de conceptos aplicables + monto (si existe registro en movimientos_detalles)
         *
         * Flujo:
         * 1) Si no se envía fecha, usa la actual (formato usado por el código original)
         * 2) Llama a la función SQL obtenerCuentaUsuario(usuarioID, fecha)
         * 3) Retorna listado de conceptos con su monto (0 si no existe)
         *
         * Nota:
         * - El token llega como parámetro pero aquí no se usa directamente.
         *
         * @param int $usuarioID ID del usuario.
         * @param string $token Token de autenticación.
         * @param string $fecha Fecha para filtrar (según formato esperado por la función SQL).
         * @return array Listado de conceptos/montos para esa fecha.
         */
        function cargarDatosUsuario($usuarioID, $token, $fecha){
          // Si no llega fecha, usar fecha actual (formato del código original)
          if ($fecha=="") $fecha = date("d/m/Y");

                // Guardar contexto (usuario)
                $this->usuarioID = $usuarioID;

                try {
                // 1) Obtener instancia única de la conexión
                $db = Database::getInstance();

                // 2) Llamada a función PostgreSQL obtenerCuentaUsuario
                $sql = "obtenerCuentaUsuario($1, $2)";
                $params = [$this->usuarioID, $fecha];

                // 3) Ejecutar la función con parámetros
                $result = $db->queryParams($sql, $params);

                // 4) Obtener todos los registros devueltos
                $conceptos = [];
                while ($row = pg_fetch_assoc($result)) {
                    $conceptos[] = $row;
                }

                // 5) Devolver el listado al front
                return $conceptos;

            } catch (Exception $e) {
                // Manejo de error: devuelve el mensaje en JSON
                echo json_encode(['error' => $e->getMessage()]);
            }
        }
    };
?>
