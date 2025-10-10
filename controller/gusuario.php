<?php
    class GUsuario {
        public $usuario;
        public $contrasena;
        
        function validarParametros($usuario, $contrasena){
            $this->usuario = $usuario;
            $this->contrasena = $contrasena;
            // Llamamos a la función traerBalance de la entidad ECuenta E-003, esta funcion permite traer el balance del usuario
            return array("cuentaExiste"=>true, "tipoUsuario"=>1, "usuarioID"=>1);
        }
        function mostrarUsuarios(){

        }
        function guardarDatos(){

        }
    };
?>