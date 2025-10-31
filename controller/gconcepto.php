<?php
    require_once 'database.php';
    /**
         * G-003 Controlador GConcepto se encarga de la gestion de conceptos
    **/
    class GConcepto {
        public $nombre;
        public $tipo;
        public $periodo;
        public $dia;
        public $usuarioID;
        public $token;
        public $conceptoID;

        /**
         * FCC-001
         * encarga de validar si el concepto existe y guardar los datos
         *
         * @param string $nombre Nombre del concepto.
         * @param int $tipo Tipo de concepto.
         * @param int $periodo Periodo asociado.
         * @param string $dias Días aplicables.
         * @param int $usuario_id ID del usuario que crea el concepto.
         * @param string $token Token de autenticación.
         * @return valido=true, si el concepto es valido, y guardarOk=true, si se guardo.
         */
        function validarParametros($nombre, $tipo, $periodo, $dia, $usuarioID, $token){
            $this->nombre = $nombre;
            $this->tipo = $tipo;
            $this->periodo = $periodo;
            $this->dia = $dia;
            $this->usuarioID = $usuarioID;
            $this->token = $token;
            //creamos una instancia a la base de datos
            $db = Database::getInstance();

            // Llamamos a la función validarconcepto de la entidad concepto E-004, esta funcion consulta si existe el concepto
            $sql = "SELECT validarConcepto($1, $2) AS valido";
            $params = array($this->nombre, $this->usuarioID);

            // Ejecutar consulta con parámetros
            $result = $db->queryParams($sql, $params);

            // Obtener resultado
            $row = pg_fetch_assoc($result);

            // Interpretar el resultado booleano
            if ($row['valido'] === 't') { 
                
                //Generamos otra instancia a la base de datos, pero como esta con singleton es una unica instancia
                $db = Database::getInstance();

                /*Llamamos a la funcion guardar concepto de la entidad E-004 enviando los parametros:
                    nombre, tipo, periodo, dias, usuarioID y token
                */

                $sql = "SELECT guardarConcepto($1, $2, $3, $4, $5, $6) AS r";
                $params = [$this->nombre, $this->tipo, $this->periodo, $this->dia, $this->usuarioID, $this->token];

                //Ejecutamos la consulta
                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                //Si todo fue correcto, devuelve el id

                return array("valido"=>true, "guardarOk"=>true);
            } else {
                return array("valido"=>false);
            }
        }
        /**FCC-002
         * se encarga de traer los conceptos de acuerdo a la periodicidad de la fecha
         *
         * @param int $usuario_id ID del usuario que crea el concepto.
         * @param string $token Token de autenticación.
         * @param date $fecha fecha para la periodicidad.
         * @return listado, de los conceptos de acuerdo a la periodicidad
         */
        function traerConceptoPorPeriodicidad($usuarioID, $token, $fecha){
            if ($fecha=="") $fecha = date("d/m/Y");
            $this->usuarioID = $usuarioID;
            try {
            // 1. Obtener instancia única de la conexión
            $db = Database::getInstance();

            
            // 2. Consulta que llama a la función PostgreSQL
            $sql = "SELECT * FROM traerConceptos($1, $2)";
            $params = [$this->usuarioID, $fecha];

            // 3. Ejecutar la función con parámetros
            $result = $db->queryParams($sql, $params);

            // 4. Obtener todos los registros devueltos
            $conceptos = [];
            while ($row = pg_fetch_assoc($result)) {
                $conceptos[] = $row;
            }

            // 5. devolver el listado
            return $conceptos;

        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        }
        /**FCC-003
         * se encarga de traer los conceptos de acuerdo al usuario
         *
         * @param int $usuario_id ID del usuario que crea el concepto.
         * @param string $token Token de autenticación.
         * @return listado, de los conceptos de acuerdo a la periodicidad
         */
        function traerConceptos($usuarioID, $token){
            $this->usuarioID = $usuarioID;
            try {
            // 1. Obtener instancia única de la conexión
            $db = Database::getInstance();

            
            // 2. Consulta que llama a la función PostgreSQL
            $sql = "SELECT * FROM traerConceptos($1)";
            $params = [$this->usuarioID];

            // 3. Ejecutar la función con parámetros
            $result = $db->queryParams($sql, $params);

            // 4. Obtener todos los registros devueltos
            $conceptos = [];
            while ($row = pg_fetch_assoc($result)) {
                $conceptos[] = $row;
            }

            // 5. devolver el listado
            return $conceptos;

        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        }
        /**FCC-004
         * se encarga de traer el conceptos de acuerdo al id
         *
         * @param int $conceptoid ID del concepto.
         */
        function traerDatos($conceptoID){
            $this->conceptoID = $conceptoID;
            try {
                // 1. Obtener instancia única de la conexión
                $db = Database::getInstance();

                
                // 2. Consulta que llama a la función PostgreSQL
                $sql = "SELECT * FROM consultarDatos($1)";
                $params = [$this->conceptoID];

                // 3. Ejecutar la función con parámetros
                $result = $db->queryParams($sql, $params);

                // 4. Obtener todos los registros devueltos
                $conceptos = [];
                while ($row = pg_fetch_assoc($result)) {
                    $conceptos[] = $row;
                }

                // 5. devolver el listado
                return $conceptos;

            } catch (Exception $e) {
                echo json_encode(['error' => $e->getMessage()]);
            }
        }
        /**
         * FCC-005
         * encarga de validar si el concepto existe y guardar los datos
         *
         * @param string $nombre Nombre del concepto.
         * @param int $tipo Tipo de concepto.
         * @param int $periodo Periodo asociado.
         * @param string $dias Días aplicables.
         * @param int $usuario_id ID del usuario que crea el concepto.
         * @param string $token Token de autenticación.
         * @return valido=true, si el concepto es valido, y guardarOk=true, si se guardo.
         */
        function validarDatos($conceptoid, $nombre, $tipo, $periodo, $dia, $usuarioID, $token){
            $this->conceptoID = $conceptoid;
            $this->nombre = $nombre;
            $this->tipo = $tipo;
            $this->periodo = $periodo;
            $this->dia = $dia;
            $this->usuarioID = $usuarioID;
            $this->token = $token;
            //creamos una instancia a la base de datos
            $db = Database::getInstance();

            // Llamamos a la función validarconcepto de la entidad concepto E-004, esta funcion consulta si existe el concepto
            $sql = "SELECT validar($1, $2, $3) AS cambioOk";
            $params = array($this->conceptoID, $this->nombre, $this->usuarioID);

            // Ejecutar consulta con parámetros
            $result = $db->queryParams($sql, $params);

            // Obtener resultado
            $row = pg_fetch_assoc($result);
            // Interpretar el resultado booleano
            if ($row['cambiook'] === 't') { 
                
                //Generamos otra instancia a la base de datos, pero como esta con singleton es una unica instancia
                $db = Database::getInstance();

                /*Llamamos a la funcion guardar concepto de la entidad E-004 enviando los parametros:
                    nombre, tipo, periodo, dias, usuarioID y token
                */

                $sql = "SELECT guardarModificacion($1, $2, $3, $4, $5, $6, $7) AS r";
                $params = [$this->conceptoID, $this->nombre, $this->tipo, $this->periodo, $this->dia, $this->usuarioID, $this->token];

                //Ejecutamos la consulta
                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                //Si todo fue correcto, devuelve el id

                return array("valido"=>true, "conceptoModificado"=>true);
            } else {
                return array("valido"=>false);
            }
        }
        /**
         * FCC-006
         * Actualizar estado
         *
         * @param int $conceptoID id del concepto
         * @param int $estado estado.
         * @return estado=true, se se cambio.
         */
        function actualizarEstado($conceptoid, $estado){
            $this->conceptoID = $conceptoid;
            //creamos una instancia a la base de datos
            $db = Database::getInstance();

            // Llamamos a la función validarconcepto de la entidad concepto E-004, esta funcion consulta si existe el concepto
            $sql = "SELECT validarEstado($1, $2) AS estado";
            $params = array($this->conceptoID, $estado);

            // Ejecutar consulta con parámetros
            $result = $db->queryParams($sql, $params);

            // Obtener resultado
            $row = pg_fetch_assoc($result);
            // Interpretar el resultado booleano
            if ($row['estado'] === 'f') { 
                
                //Generamos otra instancia a la base de datos, pero como esta con singleton es una unica instancia
                $db = Database::getInstance();

                /*Llamamos a la funcion guardar concepto de la entidad E-004 enviando los parametros:
                    nombre, tipo, periodo, dias, usuarioID y token
                */

                $sql = "SELECT actualizarEstado($1, $2) AS r";
                $params = [$this->conceptoID, $estado];

                //Ejecutamos la consulta
                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                //Si todo fue correcto, devuelve el id

                return array("estado"=>true, "nuevoEstado"=>true);
            } else {
                return array("estado"=>false);
            }
        }
    };
?>