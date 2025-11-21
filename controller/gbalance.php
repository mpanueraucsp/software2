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
         * FCB001
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
        /**
         * FCB002
         * encarga de traer el balance anual de los ingresos y egresos por el usuario a una fecha determinada
         *
         * @param int $usuario_id ID del usuario del cual se genera el balance.
         * @param string $token Token de autenticación.
         * @param date $fecha si se requiere a una fecha determinada.
         * @return lista que contiene el total_general y total_mensual.
         */
        function traerBalanceLista($token, $usuarioID, $tipoUsuario, $fecha=""){
            
            $db = Database::getInstance();

            //$usuarioID = 10;
            //$token = 'token123';
            if ($fecha=="") $fecha = date('Y-m-d');
            //$fecha = date('Y-m-d');
            // Llamamos a la función traerBalance de la entidad ECuenta E-003, esta funcion permite traer el balance del usuario
            $sql = "SELECT * FROM traerMovimientos($1, $2, $3, $4)";
            $params = [$token, $usuarioID, $tipoUsuario, $fecha];
            $res = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($res);   
            //var_dump($row);
            if ($row["listamovimientos"]==NULL){
                $row["listamovimientos"] = "[]";
            }
            $respuesta = [
                "listaBalance" => json_decode($row["listabalance"], true),
                "listaMovimientos" => json_decode($row["listamovimientos"], true)
            ];
            return $respuesta;
            //return array("lista"=>array("total_general"=>$balance["total_general"], "total_mensual"=>$balance["total_mensual"]));
        }
        /**
         * * FCB003
         * encarga de traer los datos para generar el grafico
         *
         * @param int $usuario_id ID del usuario del cual se genera el balance.
         * @param string $token Token de autenticación.
         * @param date $fecha si se requiere a una fecha determinada.
         * @return lista que contiene el total_general y total_mensual.
         */
        function traerGraficoIngresos($token, $usuarioID){
            
            $db = Database::getInstance();
            $sql = "SELECT * FROM traerResumen($1, $2)";

            // INGRESOS
            $resultIngresos = $db->queryParams($sql, [$usuarioID, '1']);
            $ingresos = $db->fetchAll($resultIngresos);

            // GASTOS
            $resultGastos = $db->queryParams($sql, [$usuarioID, '-1']);
            $gastos = $db->fetchAll($resultGastos);
            return array("ingresos"=>$ingresos, "gastos"=>$gastos);
        }
         /**
         * FCB004
         * encarga de traer el balance anual de los ingresos y egresos por el usuario a una fecha determinada
         *
         * @param int $usuario_id ID del usuario del cual se genera el balance.
         * @param string $token Token de autenticación.
         * @param date $fecha si se requiere a una fecha determinada.
         * @return lista que contiene el total_general y total_mensual.
         */
        function traerHistorial($token, $usuarioID,$fechainicio, $fechafin){
            
            $db = Database::getInstance();

            
            
            //$fecha = date('Y-m-d');
            // Llamamos a la función traerBalance de la entidad ECuenta E-003, esta funcion permite traer el balance del usuario
            $sql = "SELECT * FROM traerHistorial($1, $2, $3, $4)";
            $params = [$token, $usuarioID, $fechainicio, $fechafin];
            $res = $db->queryParams($sql, $params);
            $historial = pg_fetch_all($res);
            //var_dump($row);
            $respuesta = [
                "total" => 0.00,
                "lista" => $historial
            ];
            return $respuesta;
            //return array("lista"=>array("total_general"=>$balance["total_general"], "total_mensual"=>$balance["total_mensual"]));
        }
    };
?>