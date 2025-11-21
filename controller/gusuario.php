<?php
    require_once 'database.php';

    /**
     * G-001 Controlador GUsuario
     * Se encarga de la gestión de usuarios: Login, Listado y Creación.
     */
    class GUsuario {
        public $usuario;
        public $contrasena;

        /**
         * FCU-001
         * Se encarga de validar las credenciales del usuario para el inicio de sesión.
         *
         * @param string $usuario Nombre de usuario (login).
         * @param string $contrasena Contraseña del usuario.
         * @return array Retorna estado de existencia, ID y tipo de perfil.
         */
        function validarParametros($usuario, $contrasena){
            $this->usuario = $usuario;
            $this->contrasena = $contrasena;
            $db = Database::getInstance();
            
            // Llama a la función SQL verificarUsuario
            $sql = "SELECT * FROM verificarUsuario($1, $2)";
            $params = [ $this->usuario, $this->contrasena ];
            
            $res = $db->queryParams($sql, $params);
            $row = pg_fetch_assoc($res);

            if ($row && $row["cuentaexiste"] === 't') {
                return array(
                    "cuentaExiste" => true, 
                    "usuarioID" => (int)$row["usuarioid"], 
                    "tipoUsuario" => $row["tipousuario"]
                );
            } else {
                return array("cuentaExiste" => false, "usuarioID" => null, "tipoUsuario" => null);
            }
        }

        /**
         * FCU-002
         * Se encarga de obtener el listado completo de usuarios registrados.
         *
         * @return array Lista de usuarios con sus datos básicos.
         */
        function mostrarUsuarios(){
            $db = Database::getInstance();
            
            // Consulta directa para traer usuarios ordenados por ID
            $sql = "SELECT usuario_id, nombre, usuario, tipousuario_id as perfil, estado 
                    FROM usuarios 
                    ORDER BY usuario_id ASC"; 
            
            $res = $db->query($sql);
            $usuarios = array();
            
            while ($row = pg_fetch_assoc($res)) {
                $usuarios[] = array(
                    "usuarioID" => (int)$row["usuario_id"],
                    "nombre" => $row["nombre"],
                    "usuario" => $row["usuario"],
                    "perfil" => $row["perfil"], // ID del perfil (1, 2, 3)
                    "estado" => $row["estado"]  // 1=Activo, 0=Inactivo
                );
            }
            return $usuarios;
        }

        /**
         * FCU-003
         * Se encarga de insertar un nuevo registro de usuario en la base de datos.
         *
         * @param string $nombre Nombre completo de la persona.
         * @param string $usuario Nombre de usuario para login.
         * @param string $contrasena Contraseña.
         * @param int $tipoUsuario ID del perfil (1:Admin, 2:Miembro, etc).
         * @param int $usuarioID_creador (Opcional) ID de quien realiza la acción (para logs).
         * @return array Resultado de la operación (success: bool, id: int).
         */
        function crearUsuario($nombre, $usuario, $contrasena, $tipoUsuario, $usuarioID_creador){
            $db = Database::getInstance();

            // Query de Inserción (INSERT) en PostgreSQL
            // Se asume estado = 1 (Activo) por defecto al crear
            $sql = "INSERT INTO usuarios (nombre, usuario, contrasena, tipousuario_id, estado) 
                    VALUES ($1, $2, $3, $4, 1) 
                    RETURNING usuario_id";
            
            try {
                $params = [
                    $nombre, 
                    $usuario, 
                    $contrasena, 
                    (int)$tipoUsuario
                ];

                $res = $db->queryParams($sql, $params);
                $row = pg_fetch_assoc($res);

                if ($row) {
                    return array("success" => true, "id" => $row['usuario_id']);
                } else {
                    return array("success" => false, "msg" => "No se devolvió ID al insertar");
                }
            } catch (Exception $e) {
                return array("success" => false, "msg" => "Error BD: " . $e->getMessage());
            }
        }
    };
?>