<?php
    require_once 'database.php';

    /**
     * CGC001
     * Controlador - GConcepto (gconcepto.php).
     * Propósito: gestionar los conceptos del sistema (crear, listar, consultar, modificar y cambiar estado).
     * Dependencias:
     * - Database (Singleton) para ejecutar consultas
     * - Funciones de BD: validarConcepto, guardarConcepto, traerConceptos, consultarDatos, validar, guardarModificacion,
     *   validarEstado, actualizarEstado
     **/
    class GConcepto {
        // Propiedades de trabajo del controlador (datos del concepto y contexto del usuario)
        public $nombre;
        public $tipo;
        public $periodo;
        public $dia;
        public $usuarioID;
        public $token;
        public $conceptoID;

        /**
         * CGC002
         * Controlador - Concepto (Crear).
         * Se encarga de validar si el concepto (por nombre) ya existe para el usuario y, si es válido, lo guarda.
         *
         * Flujo:
         * 1) Guarda parámetros en el objeto (this)
         * 2) Llama a validarConcepto(nombre, usuarioID) para evitar duplicados
         * 3) Si es válido, llama a guardarConcepto(nombre, tipo, periodo, dia, usuarioID, token)
         * 4) Retorna flags para la capa de interfaz
         *
         * @param string $nombre Nombre del concepto.
         * @param int $tipo Tipo de concepto.
         * @param int $periodo Periodo asociado.
         * @param string $dia Días aplicables.
         * @param int $usuarioID ID del usuario que crea el concepto.
         * @param string $token Token de autenticación.
         * @return array valido=true si pasa validación; guardarOk=true si se guardó.
         */
        function validarParametros($nombre, $tipo, $periodo, $dia, $usuarioID, $token){
            // Guardar parámetros en el controlador
            $this->nombre = $nombre;
            $this->tipo = $tipo;
            $this->periodo = $periodo;
            $this->dia = $dia;
            $this->usuarioID = $usuarioID;
            $this->token = $token;

            // Crear/obtener instancia única de BD
            $db = Database::getInstance();

            // Validación de duplicado: consulta si el concepto ya existe para el usuario
            $sql = "SELECT validarConcepto($1, $2) AS valido";
            $params = array($this->nombre, $this->usuarioID);

            // Ejecutar consulta con parámetros
            $result = $db->queryParams($sql, $params);

            // Obtener resultado (valido = 't' o 'f')
            $row = pg_fetch_assoc($result);

            // Si es válido (no existe duplicado), se procede a guardar
            if ($row['valido'] === 't') {

                // Reutiliza la misma instancia (Singleton)
                $db = Database::getInstance();

                // Guardar concepto en BD
                $sql = "SELECT guardarConcepto($1, $2, $3, $4, $5, $6) AS r";
                $params = [$this->nombre, $this->tipo, $this->periodo, $this->dia, $this->usuarioID, $this->token];

                // Ejecutar guardado
                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                // Respuesta para la interfaz
                return array("valido"=>true, "guardarOk"=>true);
            } else {
                // Ya existe un concepto igual para el usuario (duplicado)
                return array("valido"=>false);
            }
        }

        /**
         * CGC003
         * Controlador - Concepto (Listar por periodicidad).
         * Se encarga de traer conceptos del usuario aplicables a una fecha según su periodicidad.
         *
         * Nota:
         * - El token llega como parámetro, pero aquí no se usa directamente (la validación puede estar en la función SQL).
         *
         * @param int $usuarioID ID del usuario.
         * @param string $token Token de autenticación.
         * @param string $fecha Fecha usada para calcular la periodicidad.
         * @return array Listado de conceptos aplicables para esa fecha.
         */
        function traerConceptoPorPeriodicidad($usuarioID, $token, $fecha){
            // Si no llega fecha, usar la fecha actual (formato usado por el código original)
            if ($fecha=="") $fecha = date("d/m/Y");

            $this->usuarioID = $usuarioID;

            try {
                // 1) Obtener instancia única de la conexión
                $db = Database::getInstance();

                // 2) Llamada a función PostgreSQL que filtra por periodicidad/fecha
                $sql = "SELECT * FROM traerConceptos($1, $2)";
                $params = [$this->usuarioID, $fecha];

                // 3) Ejecutar función con parámetros
                $result = $db->queryParams($sql, $params);

                // 4) Obtener todos los registros devueltos
                $conceptos = [];
                while ($row = pg_fetch_assoc($result)) {
                    $conceptos[] = $row;
                }

                // 5) Devolver el listado
                return $conceptos;

            } catch (Exception $e) {
                // Manejo de error: devuelve el mensaje en formato JSON
                echo json_encode(['error' => $e->getMessage()]);
            }
        }

        /**
         * CGC004
         * Controlador - Concepto (Listar por usuario).
         * Se encarga de traer todos los conceptos asociados a un usuario.
         *
         * Nota:
         * - El token llega como parámetro, pero aquí no se usa directamente.
         *
         * @param int $usuarioID ID del usuario.
         * @param string $token Token de autenticación.
         * @return array Listado de conceptos del usuario.
         */
        function traerConceptos($usuarioID, $token){
            $this->usuarioID = $usuarioID;

            try {
                // 1) Obtener instancia única de la conexión
                $db = Database::getInstance();

                // 2) Llamada a función PostgreSQL que trae conceptos por usuario
                $sql = "SELECT * FROM traerConceptos($1)";
                $params = [$this->usuarioID];

                // 3) Ejecutar función con parámetros
                $result = $db->queryParams($sql, $params);

                // 4) Obtener todos los registros devueltos
                $conceptos = [];
                while ($row = pg_fetch_assoc($result)) {
                    $conceptos[] = $row;
                }

                // 5) Devolver el listado
                return $conceptos;

            } catch (Exception $e) {
                // Manejo de error: devuelve el mensaje en formato JSON
                echo json_encode(['error' => $e->getMessage()]);
            }
        }

        /**
         * CGC005
         * Controlador - Concepto (Consultar por ID).
         * Se encarga de traer los datos de un concepto específico según su ID.
         *
         * @param int $conceptoID ID del concepto.
         * @return array Datos del concepto (lista con 1 elemento o vacío si no existe).
         */
        function traerDatos($conceptoID){
            $this->conceptoID = $conceptoID;

            try {
                // 1) Obtener instancia única de la conexión
                $db = Database::getInstance();

                // 2) Llamada a función PostgreSQL consultarDatos(conceptoID)
                $sql = "SELECT * FROM consultarDatos($1)";
                $params = [$this->conceptoID];

                // 3) Ejecutar función con parámetros
                $result = $db->queryParams($sql, $params);

                // 4) Obtener todos los registros devueltos
                $conceptos = [];
                while ($row = pg_fetch_assoc($result)) {
                    $conceptos[] = $row;
                }

                // 5) Devolver el listado
                return $conceptos;

            } catch (Exception $e) {
                // Manejo de error: devuelve el mensaje en formato JSON
                echo json_encode(['error' => $e->getMessage()]);
            }
        }

        /**
         * CGC006
         * Controlador - Concepto (Modificar).
         * Se encarga de validar si el nombre de concepto no duplica otro (excluyendo el mismo conceptoid)
         * y, si es válido, guarda la modificación.
         *
         * Flujo:
         * 1) Llama a validar(conceptoid, nombre, usuarioID) para confirmar que el cambio es permitido
         * 2) Si es OK, llama a guardarModificacion(conceptoid, nombre, tipo, periodo, dia, usuarioID, token)
         *
         * @param int $conceptoid ID del concepto a modificar.
         * @param string $nombre Nuevo nombre del concepto.
         * @param int $tipo Nuevo tipo.
         * @param int $periodo Nueva periodicidad.
         * @param string $dia Nuevos días aplicables.
         * @param int $usuarioID ID del usuario.
         * @param string $token Token de autenticación.
         * @return array valido=true si pasó validación; conceptoModificado=true si se guardó.
         */
        function validarDatos($conceptoid, $nombre, $tipo, $periodo, $dia, $usuarioID, $token){
            // Guardar parámetros en el controlador
            $this->conceptoID = $conceptoid;
            $this->nombre = $nombre;
            $this->tipo = $tipo;
            $this->periodo = $periodo;
            $this->dia = $dia;
            $this->usuarioID = $usuarioID;
            $this->token = $token;

            // Obtener instancia de BD
            $db = Database::getInstance();

            // Validación: evita duplicados al editar (excluye el mismo conceptoid)
            $sql = "SELECT validar($1, $2, $3) AS cambioOk";
            $params = array($this->conceptoID, $this->nombre, $this->usuarioID);

            // Ejecutar consulta
            $result = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($result);

            // Si cambioOk es TRUE, se procede a guardar
            if ($row['cambiook'] === 't') {

                // Reutiliza instancia Singleton
                $db = Database::getInstance();

                // Guardar modificación del concepto
                $sql = "SELECT guardarModificacion($1, $2, $3, $4, $5, $6, $7) AS r";
                $params = [$this->conceptoID, $this->nombre, $this->tipo, $this->periodo, $this->dia, $this->usuarioID, $this->token];

                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                // Respuesta para la interfaz
                return array("valido"=>true, "conceptoModificado"=>true);
            } else {
                // No se permite el cambio (duplicado u otra regla definida en la función validar)
                return array("valido"=>false);
            }
        }

        /**
         * CGC007
         * Controlador - Concepto (Actualizar estado).
         * Se encarga de:
         * 1) Validar si el estado actual ya coincide con el solicitado (validarEstado)
         * 2) Si NO coincide, actualiza el estado (actualizarEstado)
         * 3) Retorna flags indicando si se cambió o no
         *
         * @param int $conceptoid ID del concepto.
         * @param int $estado Nuevo estado a aplicar.
         * @return array estado=true si se pudo cambiar; nuevoEstado=true si se realizó la actualización.
         */
        function actualizarEstado($conceptoid, $estado){
            $this->conceptoID = $conceptoid;

            // Obtener instancia de BD
            $db = Database::getInstance();

            // Validar si el estado ya es el mismo (TRUE si coincide)
            $sql = "SELECT validarEstado($1, $2) AS estado";
            $params = array($this->conceptoID, $estado);

            $result = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($result);

            // Si estado = 'f', significa que NO coincide y se debe actualizar
            if ($row['estado'] === 'f') {

                // Reutiliza instancia Singleton
                $db = Database::getInstance();

                // Actualiza el estado en BD
                $sql = "SELECT actualizarEstado($1, $2) AS r";
                $params = [$this->conceptoID, $estado];

                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                // Respuesta de éxito
                return array("estado"=>true, "nuevoEstado"=>true);
            } else {
                // El estado ya era el mismo (no se actualiza)
                return array("estado"=>false);
            }
        }
    };
?>
