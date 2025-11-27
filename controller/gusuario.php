<?php
    require_once 'database.php';

    /**
     * CGU001
     * Controlador - GUsuario (gusuario.php).
     * Propósito: gestionar operaciones de usuarios:
     * - Validar credenciales (login)
     * - Listar usuarios
     * - Crear usuarios
     *
     * Dependencias:
     * - Database (Singleton)
     * - Funciones de BD: verificarUsuario, mostrarUsuarios
     * - Operaciones directas: INSERT en tabla usuarios (crearUsuario)
     **/
    class GUsuario {
        public $usuario;      // Username ingresado por el usuario
        public $contrasena;   // Contraseña ingresada (texto plano antes de aplicar hash en BD)

        /**
         * CGU002
         * Controlador - Usuario (Login).
         * Se encarga de validar si el usuario existe en la base de datos mediante la función verificarUsuario.
         *
         * Flujo:
         * 1) Guarda usuario y contraseña en el controlador (this)
         * 2) Llama a la función SQL verificarUsuario(usuario, contrasena)
         * 3) Si cuentaExiste = true, retorna usuarioID y tipoUsuario
         * 4) Si no, retorna valores nulos
         *
         * @param string $usuario Nombre de usuario (login).
         * @param string $contrasena Contraseña (texto plano; la función SQL aplica md5).
         * @return array Respuesta con cuentaExiste, usuarioID y tipoUsuario.
         */
        function validarParametros($usuario, $contrasena){
            // Guardar parámetros en el controlador
            $this->usuario = $usuario;
            $this->contrasena = $contrasena;

            // Obtener instancia BD (Singleton)
            $db = Database::getInstance();

            // Llamada a función SQL de autenticación
            $sql = "SELECT * FROM verificarUsuario($1, $2)";
            $params = [ $this->usuario, $this->contrasena ];

            // Ejecutar consulta parametrizada
            $res = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($res);

            // Interpretar respuesta: cuenta existe y está activa
            if ($row && $row["cuentaexiste"] === 't') {
                return array(
                    "cuentaExiste" => true,                 // Login correcto
                    "usuarioID" => (int)$row["usuarioid"],  // ID del usuario
                    "tipoUsuario" => $row["tipousuario"]    // Perfil/rol
                );
            } else {
                // Login inválido
                return array(
                    "cuentaExiste" => false,
                    "usuarioID" => null,
                    "tipoUsuario" => null
                );
            }
        }

        /**
         * CGU003
         * Controlador - Usuario (Listar usuarios).
         * Se encarga de mostrar el listado de usuarios activos con su perfil, usando la función mostrarUsuarios().
         *
         * Flujo:
         * 1) Ejecuta SELECT * FROM mostrarUsuarios()
         * 2) Recorre el resultset y arma un arreglo con los campos requeridos
         *
         * @return array Listado de usuarios (usuarioID, nombre, nombre_de_usuario, perfil).
         */
        function mostrarUsuarios(){
            // Obtener instancia BD
            $db = Database::getInstance();

            // Llamada a función SQL de listado
            $sql = "SELECT * FROM mostrarUsuarios()";
            $res = $db->query($sql);

            // Armar arreglo de respuesta para la interfaz
            $usuarios = array();
            while ($row = pg_fetch_assoc($res)) {
                $usuarios[] = array(
                    "usuarioID" => (int)$row["usuarioid"],          // ID usuario
                    "nombre" => $row["nombre"],                     // Nombre completo
                    "nombre_de_usuario" => $row["nombre_de_usuario"],// Username
                    "perfil" => $row["perfil"]                      // Nombre del perfil
                );
            }

            return $usuarios;
        }

        /**
         * CGU004
         * Controlador - Usuario (Listar usuarios - consulta directa).
         * Se encarga de obtener el listado completo de usuarios registrados mediante una consulta directa a la tabla.
         *
         * Nota:
         * - Este método no usa la función mostrarUsuarios().
         * - OJO: los nombres de columna aquí (usuario_id, usuario, tipousuario_id) deben existir tal cual en tu BD,
         *   si no, este método podría ser de una versión antigua del esquema.
         *
         * @return array Lista de usuarios con sus datos básicos.
         */
        function mostrarUsuarios1(){
            // Obtener instancia BD
            $db = Database::getInstance();

            // Consulta directa (tabla usuarios)
            $sql = "SELECT usuario_id, nombre, usuario, tipousuario_id as perfil, estado 
                    FROM usuarios 
                    ORDER BY usuario_id ASC";

            $res = $db->query($sql);

            // Armar arreglo de respuesta
            $usuarios = array();
            while ($row = pg_fetch_assoc($res)) {
                $usuarios[] = array(
                    "usuarioID" => (int)$row["usuario_id"], // ID usuario
                    "nombre" => $row["nombre"],             // Nombre
                    "usuario" => $row["usuario"],           // Username (columna alternativa)
                    "perfil" => $row["perfil"],             // ID del perfil
                    "estado" => $row["estado"]              // Estado (1=Activo, 0=Inactivo)
                );
            }

            return $usuarios;
        }

        /**
         * CGU005
         * Controlador - Usuario (Crear usuario).
         * Se encarga de insertar un nuevo usuario en la base de datos.
         *
         * Flujo:
         * 1) Prepara INSERT parametrizado para evitar SQL Injection
         * 2) Aplica md5 a la contraseña antes de almacenar
         * 3) Inserta con estado = 1 por defecto
         * 4) Retorna el usuarioid generado (RETURNING usuarioid)
         *
         * Nota:
         * - $usuarioID_creador llega como parámetro pero aquí no se usa (podría servir para auditoría/logs).
         *
         * @param string $nombre Nombre completo.
         * @param string $usuario Username para login.
         * @param string $contrasena Contraseña en texto plano (se convierte a md5).
         * @param int $tipoUsuario ID del perfil (perfilid).
         * @param int $usuarioID_creador ID de quien crea (no usado en este método).
         * @return array Resultado (success bool, id o msg).
         */
        function crearUsuario($nombre, $usuario, $contrasena, $tipoUsuario, $usuarioID_creador){
            // Obtener instancia BD
            $db = Database::getInstance();

            // Inserción en tabla usuarios con retorno de ID
            $sql = "INSERT INTO usuarios (nombre, nombre_de_usuario, contrasena, perfilid, estado) 
                    VALUES ($1, $2, $3, $4, 1) 
                    RETURNING usuarioid";

            try {
                // Parámetros del INSERT (md5 para contraseña)
                $params = [
                    $nombre,
                    $usuario,
                    md5($contrasena),
                    (int)$tipoUsuario
                ];

                // Ejecutar inserción parametrizada
                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                // Validar retorno de ID
                if ($row) {
                    return array("success" => true, "id" => $row['usuarioid']);
                } else {
                    return array("success" => false, "msg" => "No se devolvió ID al insertar");
                }
            } catch (Exception $e) {
                // Manejo de error de BD
                return array("success" => false, "msg" => "Error BD: " . $e->getMessage());
            }
        }
    };
?>
