<?php
    require_once 'database.php';
    /**
         * G-005 Controlador GBalance se encarga de la gestion de los balances mensuales y anuales
    **/
    class GBalance {
        public $nombre;
        public $tipo;
        public $periodo;
        public $dia;
        public $usuarioID;
        public $token;

        /**
         * encarga de traer el balance anual de los ingresos y egresos por el usuario a una fecha determinada
         *
         * @param int $usuario_id ID del usuario del cual se genera el balance.
         * @param string $token Token de autenticación.
         * @param date $fecha si se requiere a una fecha determinada.
         * @return lista que contiene el total_general y total_mensual.
         */
        function traerBalance($usuarioID, $token, $fecha=""){
            
            $db = Database::getInstance();

            
            //$usuarioID = 10;
            //$token = 'token123';
            if ($fecha=="") $fecha = date('Y-m-d');
            //$fecha = date('Y-m-d');
            // Llamamos a la función traerBalance de la entidad ECuenta E-003, esta funcion permite traer el balance del usuario
            $sql = "SELECT traerBalance($1, $2, $3) AS balance";
            $params = [$usuarioID, $token, $fecha];

            $res = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($res);

            //var_dump($row);
            $balance = json_decode($row["balance"], true);
            return array("lista"=>array("total_general"=>$balance["total_general"], "total_mensual"=>$balance["total_mensual"]));
        }
    };
?>