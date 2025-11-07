<?php
    require_once 'database.php';
    /**
         * G-001 Controlador GUsuario se encarga de la gestion de los usuarios
    **/
    class GUsuario {
        public $usuario;
        public $contrasena;
        /**
         * FCU001
         * encarga de validar si el usuario existe en la base de datos
         *
         * @param usuario 
         * @param contraseña
         * @return valido=true, si el concepto es valido, y guardarOk=true, si se guardo.
        */

        function validarParametros($usuario, $contrasena){
            $this->usuario = $usuario;
            $this->contrasena = $contrasena;
            
            $db = Database::getInstance();
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
                return array(
                    "cuentaExiste" => false,
                    "usuarioID" => null,
                    "tipoUsuario" => null
                );
            }
        }
        /**
         * FCU002
         * encarga de mostrar los usuarios
         *
         * @return listado de usuarios
        */

        function mostrarUsuarios(){
            $db = Database::getInstance();
            $sql = "SELECT * FROM mostrarUsuarios()";
            $res = $db->query($sql);
            $usuarios = array();
            while ($row = pg_fetch_assoc($res)) {
                $usuarios[] = array(
                    "usuarioID" => (int)$row["usuarioid"],
                    "nombre" => $row["nombre"],
                    "nombre_de_usuario" => $row["nombre_de_usuario"],
                    "perfil" => $row["perfil"]
                );
            }
            // Puedes devolver el array directamente
            return $usuarios;
        }

        function guardarDatos(){

        }
    };
?>