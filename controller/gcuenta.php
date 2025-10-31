<?php
    require_once 'database.php';
    /**
         * G-004 Controlador GCuenta se encarga de la gestion de cuentas de ingresos y egresos
    **/
    class GCuenta {
        public $nombre;
        public $tipo;
        public $periodo;
        public $dia;
        public $usuarioID;
        public $token;

        /**
         * FCM001
         * encarga de validar si el concepto existe y guardar los datos
         *
         * @param datos lista que trae los registros de movimientos[Fecha, usuario_id, concepto_id, monto]
         * @param string $token Token de autenticación.
         * @return valido=true, si el concepto es valido, y guardarOk=true, si se guardo.
         */
        function enviarDatos($datos){
            
            $db = Database::getInstance();

            /*$payload = [
              'fecha' => '2025-10-10',
              'usuario_id' => 10,
              'concepto_id' => 7,
              'monto' => 150.50
            ];*/
            $datosJson = json_decode($datos, true);
            //var_dump($datosJson);

            /*$payload = [
              'datos' => [
                ['fecha' => '2025-10-10', 'usuario_id' => 10, 'concepto_id' => 7, 'monto' => 150.50],
                ['fecha' => '2025-10-10', 'usuario_id' => 10, 'concepto_id' => 8, 'monto' => 200.00],
              ]
            ];*/
            // Llamamos a la función guardarDatos de la entidad ECuenta E-003, esta funcion guarda los datos enviados desde el G-004
            $sql = "SELECT guardarDatos($1::jsonb) AS r";
            $params = [ json_encode($datosJson, JSON_UNESCAPED_UNICODE) ];

            $res = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($res);
            //echo $row['r']; // JSON con ok, cuenta_id, cuenta_detalle_id
            //$aRow = json_encode($row);
            //var_dump($row["r"]);
            $r = json_decode($row["r"], true);
            //var_dump($r);
            return array("success"=>$r["ok"]);
        }
    };
?>