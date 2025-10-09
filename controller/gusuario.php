<?php
    class GUsuario {
        public $usuario;
        public $contrasena;
        function validarParametros($parametros){
            $this->usuario = $parametros["usuario"];
            $this->contrasena = $parametros["contrasena"];
            return array("cuentaExiste"=>true, "tipoUsuario"=>1, "usuarioID"=>1);
        }
        function mostrarUsuarios(){

        }
        function guardarDatos(){

        }
    };
?>