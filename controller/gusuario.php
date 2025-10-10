<?php
    class GUsuario {
        public $usuario;
        public $contrasena;
        function validarParametros($usuario, $contrasena){
            $this->usuario = $usuario;
            $this->contrasena = $contrasena;
            
            return array("cuentaExiste"=>true, "tipoUsuario"=>1, "usuarioID"=>1);
        }
        function mostrarUsuarios(){

        }
        function guardarDatos(){

        }
    };
?>